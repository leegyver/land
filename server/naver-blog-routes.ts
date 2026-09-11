import { Router, Request, Response } from "express";
import { storage } from "./storage";
import { 
  generateBlogPostFromProperty, 
  generateBlogPostFromPost 
} from "./services/naver-blog-ai";
import { 
  checkNaverSessionStatus, 
  getNaverConfig, 
  saveNaverConfig, 
  launchNaverLoginWindow, 
  publishToNaverBlog,
  saveNaverCookiesManually
} from "./services/naver-blog-poster";

export const naverBlogRouter = Router();

/**
 * 관리자/중개사 권한 확인 미들웨어
 */
function requireAdminOrRealtor(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  const user = req.user as any;
  if (!user || (user.role !== "admin" && user.role !== "master" && user.role !== "realtor")) {
    return res.status(403).json({ message: "관리자 또는 중개사 권한이 필요합니다." });
  }
  next();
}

/**
 * 1. 네이버 연동 상태 및 설정 조회
 */
naverBlogRouter.get("/status", requireAdminOrRealtor, (req, res) => {
  try {
    const session = checkNaverSessionStatus();
    const config = getNaverConfig();
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");

    res.json({
      sessionExists: session.exists,
      blogId: config.blogId,
      defaultVisibility: config.defaultVisibility,
      updatedAt: session.updatedAt,
      hasGeminiKey
    });
  } catch (error: any) {
    console.error("[NaverBlogRoute] 상태 조회 실패:", error);
    res.status(500).json({ message: "상태 조회 중 오류가 발생했습니다." });
  }
});

/**
 * 2. 설정 저장
 */
naverBlogRouter.post("/config", requireAdminOrRealtor, (req, res) => {
  try {
    const { blogId, defaultVisibility, geminiApiKey } = req.body;
    const updated = saveNaverConfig({
      ...(blogId ? { blogId } : {}),
      ...(defaultVisibility ? { defaultVisibility } : {})
    });

    if (geminiApiKey && typeof geminiApiKey === 'string') {
      process.env.GEMINI_API_KEY = geminiApiKey.trim();
    }

    res.json({ success: true, config: updated });
  } catch (error: any) {
    console.error("[NaverBlogRoute] 설정 저장 실패:", error);
    res.status(500).json({ message: "설정 저장 중 오류가 발생했습니다." });
  }
});

/**
 * 3. 원클릭 네이버 로그인 브라우저 열기 (관리자가 직접 1회 로그인)
 */
naverBlogRouter.post("/open-login", requireAdminOrRealtor, async (req, res) => {
  try {
    // 백그라운드에서 비동기로 실행하고 초기 응답 반환
    launchNaverLoginWindow().then(result => {
      console.log("[NaverBlogRoute] 로그인 완료 결과:", result);
    }).catch(err => {
      console.error("[NaverBlogRoute] 로그인 창 실행 오류:", err);
    });

    res.json({ 
      success: true, 
      message: "네이버 로그인 브라우저 창이 열렸습니다. 로그인 후 2단계 인증을 완료하시면 세션이 자동 저장됩니다." 
    });
  } catch (error: any) {
    console.error("[NaverBlogRoute] 로그인 브라우저 실행 실패:", error);
    res.status(500).json({ message: "로그인 브라우저 실행 중 오류가 발생했습니다." });
  }
});

/**
 * 4. 수동 쿠키 저장 (선택 사항)
 */
naverBlogRouter.post("/save-cookies", requireAdminOrRealtor, (req, res) => {
  try {
    const { cookies, nidAut, nidSes, cookieString } = req.body;
    const input = cookieString || (nidAut && nidSes ? { nidAut, nidSes } : cookies);
    if (!input) {
      return res.status(400).json({ message: "쿠키 정보(NID_AUT, NID_SES)를 입력해주세요." });
    }
    const result = saveNaverCookiesManually(input);
    res.json(result);
  } catch (error: any) {
    console.error("[NaverBlogRoute] 쿠키 저장 실패:", error);
    res.status(500).json({ message: "쿠키 저장 중 오류가 발생했습니다." });
  }
});

/**
 * 5. AI 원고 생성 API
 */
naverBlogRouter.post("/generate", requireAdminOrRealtor, async (req, res) => {
  try {
    const { type, id, customInstructions } = req.body;
    if (!type || !id) {
      return res.status(400).json({ message: "대상 유형(type)과 ID(id)는 필수입니다." });
    }

    if (type === "property") {
      const property = await storage.getProperty(Number(id));
      if (!property) {
        return res.status(404).json({ message: "매물 정보를 찾을 수 없습니다." });
      }

      const generated = await generateBlogPostFromProperty(property, customInstructions);
      return res.json(generated);
    } 
    
    if (type === "post") {
      const post = await storage.getPost(Number(id));
      if (!post) {
        return res.status(404).json({ message: "커뮤니티 게시글을 찾을 수 없습니다." });
      }

      const generated = await generateBlogPostFromPost(post, customInstructions);
      return res.json(generated);
    }

    return res.status(400).json({ message: "유효하지 않은 type입니다 (property 또는 post)." });
  } catch (error: any) {
    console.error("[NaverBlogRoute] AI 원고 생성 실패:", error);
    res.status(500).json({ message: error.message || "AI 원고 생성 중 오류가 발생했습니다." });
  }
});

/**
 * 6. 네이버 블로그에 포스팅 발행
 */
naverBlogRouter.post("/publish", requireAdminOrRealtor, async (req, res) => {
  try {
    const { title, content, tags, imageUrls, isPublic } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "제목과 본문 내용은 필수입니다." });
    }

    const session = checkNaverSessionStatus();
    if (!session.exists) {
      return res.status(400).json({ 
        message: "네이버 로그인 세션이 없습니다. 먼저 [네이버 로그인]을 진행해주세요." 
      });
    }

    const result = await publishToNaverBlog({
      title,
      content,
      tags: Array.isArray(tags) ? tags : [],
      imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
      isPublic: Boolean(isPublic)
    });

    if (!result.success) {
      return res.status(500).json({ message: result.error || "블로그 포스팅에 실패했습니다." });
    }

    res.json({
      success: true,
      postUrl: result.postUrl,
      message: "네이버 블로그에 성공적으로 발행되었습니다!"
    });
  } catch (error: any) {
    console.error("[NaverBlogRoute] 블로그 발행 오류:", error);
    res.status(500).json({ message: error.message || "블로그 발행 처리 중 오류가 발생했습니다." });
  }
});
