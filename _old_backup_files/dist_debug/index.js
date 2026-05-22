var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/blog-fetcher.ts
var blog_fetcher_exports = {};
__export(blog_fetcher_exports, {
  blogCache: () => blogCache,
  fetchBlogPosts: () => fetchBlogPosts,
  fetchBlogPostsByCategory: () => fetchBlogPostsByCategory,
  getLatestBlogPosts: () => getLatestBlogPosts
});
import fetch5 from "node-fetch";
import * as cheerio2 from "cheerio";
async function fetchBlogPostsByCategory(blogId, categoryNo, limit = 5) {
  try {
    console.log(`\uB124\uC774\uBC84 \uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8 \uC694\uCCAD: blogId=${blogId}, categoryNo=${categoryNo}`);
    const pcUrl = categoryNo === "0" ? `https://blog.naver.com/PostList.naver?blogId=${blogId}&categoryNo=0&parentCategoryNo=11` : `https://blog.naver.com/PostList.naver?blogId=${blogId}&categoryNo=${categoryNo}`;
    const mobileUrl = categoryNo === "0" ? `https://m.blog.naver.com/${blogId}?categoryNo=0&parentCategoryNo=11` : `https://m.blog.naver.com/${blogId}?categoryNo=${categoryNo}`;
    let response = await fetch5(pcUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) {
      throw new Error(`\uBE14\uB85C\uADF8 \uB370\uC774\uD130 \uC694\uCCAD \uC2E4\uD328: ${response.status} ${response.statusText}`);
    }
    let html = await response.text();
    let $ = cheerio2.load(html);
    let posts2 = [];
    const postElements = $(".post_item, .lst_item, .se-post-item, .se_post_item, .blog2_post, .blog2_series, .post, .link-post, .list_item");
    if (postElements.length > 0) {
      console.log(`PC \uBC84\uC804 \uD30C\uC2F1: ${postElements.length}\uAC1C \uC694\uC18C \uCC3E\uC74C`);
      postElements.each((i, element) => {
        if (i >= limit) return;
        try {
          const $el = $(element);
          let postId = "";
          const href = $el.find("a").attr("href") || "";
          const logNoMatch = href.match(/logNo=(\d+)/) || href.match(/(\d{10,})$/);
          if (logNoMatch && logNoMatch[1]) {
            postId = logNoMatch[1];
          } else {
            postId = $el.attr("data-post-no") || $el.attr("data-entry-id") || `post-${Date.now()}-${i}`;
          }
          let title = "";
          const titleSelectors = [
            ".title_text",
            ".se-title-text",
            ".se_title_text",
            ".title",
            ".tit",
            ".se-module-text",
            ".se_module_text",
            ".link_title",
            ".pcol1",
            ".ell"
          ];
          for (const selector of titleSelectors) {
            const titleEl = $el.find(selector);
            if (titleEl.length > 0) {
              title = titleEl.first().text().trim();
              if (title) break;
            }
          }
          if (!title) {
            return;
          }
          if (title.includes("\n")) {
            title = title.split("\n")[0].trim();
          }
          if (title.includes("??")) {
            title = title.split("??")[0].trim() + "?";
          } else if (title.includes("? ")) {
            title = title.split("? ")[0].trim() + "?";
          }
          if (title.includes("..")) {
            title = title.split("..")[0].trim();
          }
          const patterns = [
            "\uAC15\uD654\uB3C4 \uBD80\uB3D9\uC0B0",
            "\uBD80\uB3D9\uC0B0",
            "\uACF5\uC778\uC911\uAC1C\uC0AC",
            "\uC911\uAC1C\uC0AC",
            "\uB9E4\uBB3C"
          ];
          for (const pattern of patterns) {
            const index = title.indexOf(pattern);
            if (index > 10) {
              title = title.substring(0, index).trim();
              break;
            }
          }
          if (title.length > 30) {
            title = title.substring(0, 30) + "...";
          }
          const link = `https://blog.naver.com/${blogId}/${postId}`;
          let thumbnail = "";
          const imgSelectors = [
            ".post_thumb img",
            ".se-thumbnail img",
            ".se_thumbnail img",
            ".img_thumb img",
            ".blog2_thumb img",
            ".photo_wrap img",
            ".se-image-resource",
            ".img img",
            ".thumb img",
            "img.img"
          ];
          for (const selector of imgSelectors) {
            const imgEl = $el.find(selector);
            if (imgEl.length > 0) {
              thumbnail = imgEl.first().attr("src") || imgEl.first().attr("data-lazy-src") || "";
              if (thumbnail) break;
            }
          }
          if (!thumbnail) {
            thumbnail = "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png";
          }
          let publishedAt = "";
          const dateSelectors = [
            ".date",
            ".se-date",
            ".se_date",
            ".blog2_date",
            ".time",
            ".date_post",
            ".date_time",
            ".post_date"
          ];
          for (const selector of dateSelectors) {
            const dateEl = $el.find(selector);
            if (dateEl.length > 0) {
              publishedAt = dateEl.first().text().trim();
              if (publishedAt) break;
            }
          }
          if (!publishedAt) {
            const today = /* @__PURE__ */ new Date();
            publishedAt = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
          } else {
            publishedAt = publishedAt.replace(/(\d{4})[년\-\/](\d{1,2})[월\-\/](\d{1,2})[일]?/g, "$1.$2.$3");
            if (!/^\d{4}\.\d{1,2}\.\d{1,2}/.test(publishedAt)) {
              const today = /* @__PURE__ */ new Date();
              publishedAt = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
            }
          }
          let summary = "";
          const summarySelectors = [
            ".post_content",
            ".se-text",
            ".se_text",
            ".post_text",
            ".text",
            ".se-module-text",
            ".text_passage",
            ".se-text-paragraph"
          ];
          for (const selector of summarySelectors) {
            const summaryEl = $el.find(selector);
            if (summaryEl.length > 0) {
              summary = summaryEl.first().text().trim();
              if (summary) {
                summary = summary.length > 100 ? summary.substring(0, 100) + "..." : summary;
                break;
              }
            }
          }
          posts2.push({
            id: postId,
            title,
            link,
            thumbnail,
            publishedAt,
            category: CATEGORY_NAMES[categoryNo] || `\uCE74\uD14C\uACE0\uB9AC ${categoryNo}`,
            summary
          });
        } catch (err) {
          console.error(`\uD3EC\uC2A4\uD2B8 \uD30C\uC2F1 \uC624\uB958 (\uC778\uB371\uC2A4 ${i}):`, err);
        }
      });
    }
    if (posts2.length === 0) {
      console.log("PC \uBC84\uC804 \uD30C\uC2F1 \uC2E4\uD328, \uBAA8\uBC14\uC77C \uBC84\uC804 \uC2DC\uB3C4");
      try {
        response = await fetch5(mobileUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
          }
        });
        html = await response.text();
        $ = cheerio2.load(html);
        const mobilePostElements = $("._itemSection, .list_item, .se_post, .post_item, .se_card, .post, .postlist");
        console.log(`\uBAA8\uBC14\uC77C \uBC84\uC804 \uD30C\uC2F1: ${mobilePostElements.length}\uAC1C \uC694\uC18C \uCC3E\uC74C`);
        mobilePostElements.each((i, element) => {
          if (i >= limit) return;
          try {
            const $el = $(element);
            let postId = "";
            const href = $el.find("a").attr("href") || "";
            const logNoMatch = href.match(/logNo=(\d+)/) || href.match(/(\d{10,})$/);
            if (logNoMatch && logNoMatch[1]) {
              postId = logNoMatch[1];
            } else {
              postId = `mobile-post-${Date.now()}-${i}`;
            }
            let title = "";
            const mobileTitleSelectors = [
              ".se_title",
              ".tit_feed",
              "._itemTitleContainer",
              "._feedTitle",
              ".se-title-text",
              ".title_link",
              ".title",
              ".link_title",
              ".ell"
            ];
            for (const selector of mobileTitleSelectors) {
              const titleEl = $el.find(selector);
              if (titleEl.length > 0) {
                title = titleEl.first().text().trim();
                if (title) break;
              }
            }
            if (!title) return;
            if (title.includes("\n")) {
              title = title.split("\n")[0].trim();
            } else if (title.includes("..")) {
              title = title.split("..")[0].trim();
            }
            if (title.length > 50) {
              title = title.substring(0, 50) + "...";
            }
            const link = `https://blog.naver.com/${blogId}/${postId}`;
            let thumbnail = "";
            const mobileImgSelectors = [
              "._thumbnail img",
              ".img_thumb img",
              ".img img",
              ".multi_img",
              ".se-thumbnail-image",
              ".img_area img"
            ];
            for (const selector of mobileImgSelectors) {
              const imgEl = $el.find(selector);
              if (imgEl.length > 0) {
                thumbnail = imgEl.first().attr("src") || imgEl.first().attr("data-src") || "";
                if (thumbnail) break;
              }
            }
            if (!thumbnail) {
              thumbnail = "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png";
            }
            let publishedAt = "";
            const mobileDateSelectors = [
              ".date_post",
              ".date_time",
              ".info_post time",
              ".date",
              ".date_info",
              ".pub_time"
            ];
            for (const selector of mobileDateSelectors) {
              const dateEl = $el.find(selector);
              if (dateEl.length > 0) {
                publishedAt = dateEl.first().text().trim();
                if (publishedAt) break;
              }
            }
            if (!publishedAt) {
              const today = /* @__PURE__ */ new Date();
              publishedAt = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
            } else {
              publishedAt = publishedAt.replace(/(\d{4})[년\-\/](\d{1,2})[월\-\/](\d{1,2})[일]?/g, "$1.$2.$3");
              if (!/^\d{4}\.\d{1,2}\.\d{1,2}/.test(publishedAt)) {
                const today = /* @__PURE__ */ new Date();
                publishedAt = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
              }
            }
            let summary = "";
            const mobileSummarySelectors = [
              ".se_textarea",
              ".text_passage",
              ".post_text",
              ".se-text-paragraph",
              ".text",
              ".post_ct"
            ];
            for (const selector of mobileSummarySelectors) {
              const summaryEl = $el.find(selector);
              if (summaryEl.length > 0) {
                summary = summaryEl.first().text().trim();
                if (summary) {
                  summary = summary.length > 100 ? summary.substring(0, 100) + "..." : summary;
                  break;
                }
              }
            }
            posts2.push({
              id: postId,
              title,
              link,
              thumbnail,
              publishedAt,
              category: CATEGORY_NAMES[categoryNo] || `\uCE74\uD14C\uACE0\uB9AC ${categoryNo}`,
              summary
            });
          } catch (err) {
            console.error(`\uBAA8\uBC14\uC77C \uD3EC\uC2A4\uD2B8 \uD30C\uC2F1 \uC624\uB958 (\uC778\uB371\uC2A4 ${i}):`, err);
          }
        });
      } catch (err) {
        console.error("\uBAA8\uBC14\uC77C \uBC84\uC804 \uC694\uCCAD \uC624\uB958:", err);
      }
    }
    console.log(`\uB124\uC774\uBC84 \uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8 ${posts2.length}\uAC1C \uCD94\uCD9C \uC131\uACF5, \uCE74\uD14C\uACE0\uB9AC: ${CATEGORY_NAMES[categoryNo] || categoryNo}`);
    return posts2;
  } catch (error) {
    console.error("\uB124\uC774\uBC84 \uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8 \uAC00\uC838\uC624\uAE30 \uC624\uB958:", error);
    return [];
  }
}
async function fetchBlogPosts(blogId = "9551304", categoryNos = ["0", "35", "36", "37"], limit = 5) {
  try {
    const postsPromises = categoryNos.map(
      (categoryNo) => fetchBlogPostsByCategory(blogId, categoryNo, limit)
    );
    const postsArrays = await Promise.all(postsPromises);
    const allPosts = postsArrays.flat();
    const uniquePostIds = /* @__PURE__ */ new Set();
    const filteredPosts = allPosts.filter((post) => {
      const isValid = post.title !== "\uC544\uC9C1 \uC791\uC131\uB41C \uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." && !post.id.startsWith("post-") && post.title.trim() !== "";
      if (isValid) {
        if (uniquePostIds.has(post.id)) {
          return false;
        }
        uniquePostIds.add(post.id);
        return true;
      }
      return false;
    });
    filteredPosts.sort((a, b) => {
      return b.publishedAt.localeCompare(a.publishedAt);
    });
    if (filteredPosts.length === 0) {
      console.log("\uBE14\uB85C\uADF8 \uB370\uC774\uD130 \uCD94\uCD9C \uC2E4\uD328, \uD14C\uC2A4\uD2B8 \uB370\uC774\uD130 \uC0AC\uC6A9");
      return [
        {
          id: "223869409800",
          title: "\uB0B4\uAC00 \uC774\uC81C ai\uC5D0 \uC785\uBB38\uC744 \uD55C\uAC83\uC778\uAC00?",
          link: "https://blog.naver.com/9551304/223869409800",
          thumbnail: "https://blogthumb.pstatic.net/MjAyNTA1MThfMjA4/MDAxNzQ3NTM5MjIwOTkx.lt3Zk9kp5c-9NjDHAkg6fRixgyAn3PXizR1B9E9PbbAg.bRkW0jYC2bSuLuF5hYWBat0dId9T90SJTTMkdUflQg4g.PNG/%3F%8A%A4%3F%81%AC%EB%A6%B0%EC%83%B7_2025-05-17_163709.png",
          publishedAt: "2025.05.19",
          category: "\uBE14\uB85C\uADF8 \uCD5C\uC2E0\uAE00",
          summary: "ai\uC5D0 \uB300\uD55C \uB098\uC758 \uC0DD\uAC01\uACFC \uACBD\uD5D8"
        },
        {
          id: "223809018523",
          title: "\uC870\uC2EC \uB610 \uC870\uC2EC",
          link: "https://blog.naver.com/9551304/223809018523",
          thumbnail: "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png",
          publishedAt: "2025.05.19",
          category: "\uC138\uC0C1\uC774\uC57C\uAE30",
          summary: "\uC77C\uC0C1\uC5D0\uC11C\uC758 \uC548\uC804\uACFC \uC8FC\uC758\uC0AC\uD56D"
        },
        {
          id: "222502515110",
          title: "\uBCFC\uC74C\uB3C4\uB9AC \uAC1C\uBC1C\uC6A9 \uB0AE\uC740\uC784\uC57C 18500\uD3C9",
          link: "https://blog.naver.com/9551304/222502515110",
          thumbnail: "https://blogthumb.pstatic.net/MjAyMTA5MTFfMjk3/MDAxNjMxMzQ2MjIxNjcy.P0bbr5dpaMbgjTxhAhcf69a983bg0oAffyx5Ly6ODzcg.FkEWdogH6Hz8zavcOQmyo-bYVXbQVBzSL9ANkMQ8JdUg.JPEG.9551304/Untitled-1.jpg",
          publishedAt: "2021.09.11",
          category: "\uC77C\uC0C1\uB2E4\uBC18\uC0AC",
          summary: "\uAC15\uD654\uB3C4 \uBD80\uB3D9\uC0B0 \uB9E4\uBB3C \uC18C\uAC1C"
        }
      ];
    }
    return filteredPosts.slice(0, limit);
  } catch (error) {
    console.error("\uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8 \uAC00\uC838\uC624\uAE30 \uC624\uB958:", error);
    return [];
  }
}
async function extractPostImage(blogId, postId) {
  try {
    const mobileUrl = `https://m.blog.naver.com/${blogId}/${postId}`;
    console.log(`\uD3EC\uC2A4\uD2B8 \uC774\uBBF8\uC9C0 \uCD94\uCD9C \uC2DC\uB3C4 (\uBAA8\uBC14\uC77C): ${mobileUrl}`);
    const mobileResponse = await fetch5(mobileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
      }
    });
    const mobileHtml = await mobileResponse.text();
    const $ = cheerio2.load(mobileHtml);
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) {
      console.log(`\uBAA8\uBC14\uC77C \uBC84\uC804 OpenGraph \uC774\uBBF8\uC9C0 \uBC1C\uACAC: ${ogImage}`);
      return ogImage;
    }
    const iframeUrl = $("#mainFrame").attr("src");
    if (iframeUrl) {
      const iframeImage = await extractImageFromIframe(iframeUrl);
      if (iframeImage) {
        console.log(`iframe\uC5D0\uC11C \uC774\uBBF8\uC9C0 \uBC1C\uACAC: ${iframeImage}`);
        return iframeImage;
      }
    }
    const thumbSelectors = [
      ".se-thumbnail-image",
      ".se-image-resource",
      ".se_thumbnail",
      ".se_image",
      ".img_box img",
      ".post-thumbnail",
      ".post_image"
    ];
    for (const selector of thumbSelectors) {
      const imgEl = $(selector);
      if (imgEl.length > 0) {
        const src = imgEl.attr("src") || imgEl.attr("data-src");
        if (src) {
          console.log(`\uBAA8\uBC14\uC77C \uBC84\uC804 \uC774\uBBF8\uC9C0 \uC694\uC18C \uBC1C\uACAC: ${src}`);
          return src;
        }
      }
    }
    console.log("\uBAA8\uBC14\uC77C \uBC84\uC804\uC5D0\uC11C \uC774\uBBF8\uC9C0\uB97C \uCC3E\uC9C0 \uBABB\uD568, PC \uBC84\uC804 \uC2DC\uB3C4");
    return await extractPostImageFromFullUrl(`https://blog.naver.com/${blogId}/${postId}`);
  } catch (error) {
    console.error(`\uD3EC\uC2A4\uD2B8 \uC774\uBBF8\uC9C0 \uCD94\uCD9C \uC624\uB958 (${blogId}/${postId}):`, error);
    return "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png";
  }
}
async function extractImageFromIframe(iframeSrc) {
  try {
    const fullIframeUrl = iframeSrc.startsWith("http") ? iframeSrc : `https://blog.naver.com${iframeSrc}`;
    const response = await fetch5(fullIframeUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
      }
    });
    const html = await response.text();
    const $ = cheerio2.load(html);
    const imgSelectors = [
      ".se-thumbnail-image",
      ".se-image-resource",
      ".se_thumbnail",
      ".se_image",
      ".img_box img",
      ".post-thumbnail",
      ".post_image",
      ".se-main-container img"
    ];
    for (const selector of imgSelectors) {
      const imgEl = $(selector);
      if (imgEl.length > 0) {
        const src = imgEl.attr("src") || imgEl.attr("data-src");
        if (src) return src;
      }
    }
    return "";
  } catch (error) {
    console.error("iframe \uC774\uBBF8\uC9C0 \uCD94\uCD9C \uC624\uB958:", error);
    return "";
  }
}
async function extractPostImageFromFullUrl(fullUrl) {
  try {
    console.log(`\uC804\uCCB4 URL\uB85C \uC774\uBBF8\uC9C0 \uCD94\uCD9C \uC2DC\uB3C4: ${fullUrl}`);
    const response = await fetch5(fullUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
      }
    });
    const html = await response.text();
    const $ = cheerio2.load(html);
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) {
      console.log(`PC \uBC84\uC804 OpenGraph \uC774\uBBF8\uC9C0 \uBC1C\uACAC: ${ogImage}`);
      return ogImage;
    }
    const imgSelectors = [
      ".se-thumbnail-image",
      ".se-image-resource",
      ".se_thumbnail",
      ".se_image",
      ".img_box img",
      ".post-thumbnail",
      ".post_image",
      ".se-main-container img",
      ".thumb img",
      ".representative-thumbnail img"
    ];
    for (const selector of imgSelectors) {
      const imgEl = $(selector);
      if (imgEl.length > 0) {
        const src = imgEl.attr("src") || imgEl.attr("data-src");
        if (src) {
          console.log(`PC \uBC84\uC804 \uC774\uBBF8\uC9C0 \uC694\uC18C \uBC1C\uACAC: ${src}`);
          return src;
        }
      }
    }
    console.log("\uC774\uBBF8\uC9C0\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uAE30\uBCF8 \uC774\uBBF8\uC9C0 \uBC18\uD658");
    return "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png";
  } catch (error) {
    console.error("PC \uBC84\uC804 \uC774\uBBF8\uC9C0 \uCD94\uCD9C \uC624\uB958:", error);
    return "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png";
  }
}
function getFallbackImageByCategory(category) {
  const categoryImages = {
    "\uC77C\uC0C1\uB2E4\uBC18\uC0AC": "https://postfiles.pstatic.net/MjAyNTA1MTVfMjE4/MDAxNzQ3Mjc1ODY1MTQy.ycdYfrR63FHN9GS7EzNgMu2Kiy_CldX6Zk5szOrYuVUg.yx_nZEPj7PKpEVhwuW8UuTHKQw9d8Xou7rIu0zOVEeAg.PNG/daily-life.png?type=w580",
    "\uC138\uC0C1\uC774\uC57C\uAE30": "https://postfiles.pstatic.net/MjAyNTA1MTVfNTYg/MDAxNzQ3Mjc1ODY1MTQz.1lTZM1oxLQlxw3nNcyeHvV3CpxrVwZQMg_cN2GlWBJMg.-Bi6JK8-rEdQYK07Y9aE5Y9Zrjra9ZDu8KlUbTsAWJEg.PNG/world-stories.png?type=w580",
    "\uBE14\uB85C\uADF8 \uCD5C\uC2E0\uAE00": "https://postfiles.pstatic.net/MjAyNTA1MTVfNDUg/MDAxNzQ3Mjc1ODY1MTQ0.UeOGoBn6MVN_OMFGlUCqbqI6Hkbli5oeNv5Kza2Fmrcg.3uFFdpI2JVQGBVnYNjGvcFGc1TmOqTtlHqGC5h54O7gg.PNG/latest-posts.png?type=w580",
    "\uBAA8\uB4E0 \uAE00": "https://postfiles.pstatic.net/MjAyNTA1MTVfMTAz/MDAxNzQ3Mjc1ODY1MTQ1._yBnSpkXK6yEVDkgOhJxdrvfL_tqlOjCCDYxUiJVGrAg.DmWJzgF54RkjPkfuS1QsELMdLQwT9gAZ_aMX6fU-HCMg.PNG/all-posts.png?type=w580"
  };
  console.log(`\uCE74\uD14C\uACE0\uB9AC \uAE30\uBC18 \uB300\uCCB4 \uC774\uBBF8\uC9C0 \uC0AC\uC6A9: ${category} -> ${categoryImages[category] || "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png"}`);
  return categoryImages[category] || "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png";
}
async function enrichPostsWithImages(posts2) {
  const enrichedPosts = [...posts2];
  for (let i = 0; i < enrichedPosts.length; i++) {
    const post = enrichedPosts[i];
    if (!post.thumbnail || post.thumbnail === "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png" || post.thumbnail.includes("blog_profile_thumbnail")) {
      try {
        const urlParts = post.link.split("/");
        const blogId = urlParts[urlParts.length - 2];
        const postId = urlParts[urlParts.length - 1];
        const extractedImage = await extractPostImage(blogId, postId);
        if (extractedImage && extractedImage !== "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png") {
          enrichedPosts[i].thumbnail = extractedImage;
        } else {
          enrichedPosts[i].thumbnail = getFallbackImageByCategory(post.category);
        }
      } catch (error) {
        console.error(`\uD3EC\uC2A4\uD2B8 \uC774\uBBF8\uC9C0 \uAC15\uD654 \uC2E4\uD328 (${post.id}):`, error);
        enrichedPosts[i].thumbnail = getFallbackImageByCategory(post.category);
      }
    }
  }
  return enrichedPosts;
}
async function getLatestBlogPosts(blogId = "9551304", categoryNos = ["35", "36", "37"], limit = 3) {
  const cacheKey = `${blogId}_${categoryNos.sort().join("_")}_${limit}`;
  const now = Date.now();
  if (blogCache[cacheKey] && blogCache[cacheKey].expires > now) {
    console.log(`\uCE90\uC2DC\uB41C \uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8 \uC815\uBCF4 \uBC18\uD658 (\uD0A4: ${cacheKey})`);
    return blogCache[cacheKey].posts;
  }
  console.log(`\uBE14\uB85C\uADF8 \uB370\uC774\uD130 \uC0C8\uB85C \uC694\uCCAD (\uD0A4: ${cacheKey})`);
  const allPosts = [];
  for (const categoryNo of categoryNos) {
    try {
      const categoryPosts = await fetchBlogPostsByCategory(blogId, categoryNo, limit * 5);
      if (categoryPosts && categoryPosts.length > 0) {
        console.log(`\uCE74\uD14C\uACE0\uB9AC ${categoryNo}\uC5D0\uC11C ${categoryPosts.length}\uAC1C \uD3EC\uC2A4\uD2B8 \uAC00\uC838\uC634`);
        allPosts.push(...categoryPosts);
      }
    } catch (e) {
      console.error(`\uCE74\uD14C\uACE0\uB9AC ${categoryNo} \uD3EC\uC2A4\uD2B8 \uAC00\uC838\uC624\uAE30 \uC2E4\uD328:`, e);
    }
  }
  console.log(`\uCD1D ${allPosts.length}\uAC1C \uD3EC\uC2A4\uD2B8 \uC218\uC9D1\uB428 (\uC911\uBCF5/\uD544\uD130\uB9C1 \uC804)`);
  const validPosts = allPosts.filter(
    (post) => post && post.title && post.title.trim() !== "" && post.title !== "\uC544\uC9C1 \uC791\uC131\uB41C \uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." && !post.id.startsWith("post-")
  );
  const postsWithDates = validPosts.map((post) => {
    let date;
    try {
      const [year, month, day] = post.publishedAt.split(".");
      if (year && month && day) {
        const y = parseInt(year, 10);
        const m = parseInt(month, 10) - 1;
        const d = parseInt(day, 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d) && y >= 2e3 && y <= 2025 && // 현실적인 연도 범위 체크
        m >= 0 && m < 12 && d >= 1 && d <= 31) {
          date = new Date(y, m, d);
        } else {
          date = /* @__PURE__ */ new Date();
          console.log(`\uB0A0\uC9DC \uBC94\uC704 \uC624\uB958: ${post.publishedAt}, ID: ${post.id}`);
        }
      } else {
        date = /* @__PURE__ */ new Date();
        console.log(`\uB0A0\uC9DC \uD615\uC2DD \uC624\uB958: ${post.publishedAt}, ID: ${post.id}`);
      }
    } catch (e) {
      date = /* @__PURE__ */ new Date();
      console.log(`\uB0A0\uC9DC \uD30C\uC2F1 \uC2E4\uD328: ${post.publishedAt}, ID: ${post.id}`);
    }
    const postIdNum = parseInt(post.id, 10);
    if (!isNaN(postIdNum) && postIdNum < 2e8) {
      date = new Date(2020, 0, 1);
      console.log(`\uC624\uB798\uB41C \uD3EC\uC2A4\uD2B8 \uAC10\uC9C0: ID ${post.id}\uB294 2021\uB144 \uC774\uC804 \uAC8C\uC2DC\uBB3C\uB85C \uCD94\uC815`);
    }
    return {
      ...post,
      parsedDate: date
    };
  });
  const uniqueIdMap = /* @__PURE__ */ new Map();
  for (const post of postsWithDates) {
    if (uniqueIdMap.has(post.id)) {
      const existing = uniqueIdMap.get(post.id);
      if (post.parsedDate > existing.parsedDate) {
        uniqueIdMap.set(post.id, post);
      }
    } else {
      uniqueIdMap.set(post.id, post);
    }
  }
  let sortedPosts = Array.from(uniqueIdMap.values()).sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());
  console.log(`\uC911\uBCF5 \uC81C\uAC70 \uD6C4 ${sortedPosts.length}\uAC1C\uC758 \uC720\uD6A8\uD55C \uD3EC\uC2A4\uD2B8 \uCC3E\uC74C`);
  sortedPosts = sortedPosts.slice(0, limit);
  sortedPosts.forEach((post, index) => {
    const dateStr = post.parsedDate.toISOString().split("T")[0];
    console.log(`[${index + 1}] \uB0A0\uC9DC: ${dateStr}, ID: ${post.id}, \uC81C\uBAA9: ${post.title.substring(0, 30)}${post.title.length > 30 ? "..." : ""}`);
  });
  console.log(`\uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8 \uC774\uBBF8\uC9C0 \uC815\uBCF4 \uAC15\uD654 \uC911... (${sortedPosts.length}\uAC1C)`);
  const finalPosts = sortedPosts.map(({ parsedDate, ...post }) => post);
  const enrichedPosts = await enrichPostsWithImages(finalPosts);
  if (enrichedPosts.length > 0) {
    blogCache[cacheKey] = {
      posts: enrichedPosts,
      expires: now + CACHE_TTL
    };
    console.log(`${enrichedPosts.length}\uAC1C\uC758 \uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8\uB97C \uCE90\uC2DC\uC5D0 \uC800\uC7A5 (${CACHE_TTL / (60 * 1e3)}\uBD84)`);
  }
  return enrichedPosts;
}
var CATEGORY_NAMES, blogCache, CACHE_TTL;
var init_blog_fetcher = __esm({
  "server/blog-fetcher.ts"() {
    "use strict";
    CATEGORY_NAMES = {
      "35": "\uB098\uC758 \uCDE8\uBBF8\uC0DD\uD65C",
      "36": "\uC138\uC0C1\uC774\uC57C\uAE30",
      "37": "\uBD80\uB3D9\uC0B0\uC815\uBCF4"
    };
    blogCache = {};
    CACHE_TTL = 1 * 60 * 1e3;
  }
});

// server/lib/portone.ts
var portone_exports = {};
__export(portone_exports, {
  cancelPayment: () => cancelPayment,
  getPortOneToken: () => getPortOneToken,
  verifyPayment: () => verifyPayment
});
import fetch8 from "node-fetch";
async function getPortOneToken() {
  const impKey = process.env.PORTONE_API_KEY;
  const impSecret = process.env.PORTONE_API_SECRET;
  if (!impKey || !impSecret) {
    throw new Error("PortOne V1 API key or secret is missing.");
  }
  const response = await fetch8(`${PORTONE_V1_API_URL}/users/getToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imp_key: impKey,
      imp_secret: impSecret
    })
  });
  const data = await response.json();
  if (!response.ok || data.code !== 0) {
    throw new Error(`Failed to get PortOne V1 token: ${data.message || "Unknown error"}`);
  }
  return data.response.access_token;
}
async function verifyPayment(impUid) {
  const STORE_ID = process.env.VITE_PORTONE_STORE_ID || "";
  const isV2 = STORE_ID.startsWith("store-");
  if (isV2) {
    const v2Secret = process.env.PORTONE_V2_API_SECRET;
    if (!v2Secret) {
      throw new Error("PortOne V2 API Secret\uC774 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. (.env\uC758 PORTONE_V2_API_SECRET \uD655\uC778)");
    }
    const response = await fetch8(`${PORTONE_V2_API_URL}/payments/${impUid}`, {
      method: "GET",
      headers: {
        "Authorization": `PortOne ${v2Secret}`,
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`PortOne V2 \uAC80\uC99D \uC2E4\uD328: ${data.message || "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"}`);
    }
    return {
      amount: data.amount.total,
      status: data.status === "PAID" ? "paid" : data.status.toLowerCase(),
      merchant_uid: data.id,
      ...data
    };
  } else {
    const accessToken = await getPortOneToken();
    const response = await fetch8(`${PORTONE_V1_API_URL}/payments/${impUid}`, {
      method: "GET",
      headers: { "Authorization": accessToken }
    });
    const data = await response.json();
    if (!response.ok || data.code !== 0) {
      throw new Error(`PortOne V1 \uAC80\uC99D \uC2E4\uD328: ${data.message || "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"}`);
    }
    return data.response;
  }
}
async function cancelPayment(paymentId, reason) {
  const STORE_ID = process.env.VITE_PORTONE_STORE_ID || "";
  const isV2 = STORE_ID.startsWith("store-");
  if (isV2) {
    const v2Secret = process.env.PORTONE_V2_API_SECRET;
    if (!v2Secret) {
      throw new Error("PortOne V2 API Secret\uC774 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
    }
    const response = await fetch8(`${PORTONE_V2_API_URL}/payments/${paymentId}/cancel`, {
      method: "POST",
      headers: {
        "Authorization": `PortOne ${v2Secret}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ reason })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`PortOne V2 \uCDE8\uC18C \uC2E4\uD328: ${data.message || "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"}`);
    }
    return data;
  } else {
    const accessToken = await getPortOneToken();
    const response = await fetch8(`${PORTONE_V1_API_URL}/payments/cancel`, {
      method: "POST",
      headers: {
        "Authorization": accessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        imp_uid: paymentId,
        reason
      })
    });
    const data = await response.json();
    if (!response.ok || data.code !== 0) {
      throw new Error(`PortOne V1 \uCDE8\uC18C \uC2E4\uD328: ${data.message || "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"}`);
    }
    return data.response;
  }
}
var PORTONE_V1_API_URL, PORTONE_V2_API_URL;
var init_portone = __esm({
  "server/lib/portone.ts"() {
    "use strict";
    PORTONE_V1_API_URL = "https://api.iamport.kr";
    PORTONE_V2_API_URL = "https://api.portone.io/v2";
  }
});

// server/index.ts
import express3 from "express";
import path4 from "path";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  agents: () => agents,
  banners: () => banners,
  crawledProperties: () => crawledProperties,
  favorites: () => favorites,
  inquiries: () => inquiries,
  insertAgentSchema: () => insertAgentSchema,
  insertBannerSchema: () => insertBannerSchema,
  insertCrawledPropertySchema: () => insertCrawledPropertySchema,
  insertFavoriteSchema: () => insertFavoriteSchema,
  insertInquirySchema: () => insertInquirySchema,
  insertNewsSchema: () => insertNewsSchema,
  insertNewsletterSubscriptionSchema: () => insertNewsletterSubscriptionSchema,
  insertNoticeSchema: () => insertNoticeSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertPostSchema: () => insertPostSchema,
  insertPropertyInquirySchema: () => insertPropertyInquirySchema,
  insertPropertySchema: () => insertPropertySchema,
  insertRealtorSubscriptionSchema: () => insertRealtorSubscriptionSchema,
  insertUserSchema: () => insertUserSchema,
  news: () => news,
  newsletterSubscriptions: () => newsletterSubscriptions,
  notices: () => notices,
  notifications: () => notifications,
  posts: () => posts,
  properties: () => properties,
  propertyInquiries: () => propertyInquiries,
  realtorSubscriptions: () => realtorSubscriptions,
  users: () => users
});
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var properties = sqliteTable("properties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  price: text("price").notNull(),
  address: text("address").notNull(),
  district: text("district").notNull(),
  size: text("size").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageUrls: text("imageUrls"),
  featuredImageIndex: integer("featuredImageIndex"),
  agentId: integer("agentId").notNull(),
  featured: integer("featured", { mode: "boolean" }).default(false),
  displayOrder: integer("displayOrder").default(0),
  isUrgent: integer("isUrgent", { mode: "boolean" }).default(false),
  urgentOrder: integer("urgentOrder").default(0),
  isNegotiable: integer("isNegotiable", { mode: "boolean" }).default(false),
  negotiableOrder: integer("negotiableOrder").default(0),
  isVisible: integer("isVisible", { mode: "boolean" }).default(true),
  createdAt: text("createdAt"),
  updatedAt: text("updatedAt"),
  buildingName: text("buildingName"),
  unitNumber: text("unitNumber"),
  supplyArea: text("supplyArea"),
  privateArea: text("privateArea"),
  areaSize: text("areaSize"),
  floor: integer("floor"),
  totalFloors: integer("totalFloors"),
  direction: text("direction"),
  elevator: integer("elevator", { mode: "boolean" }),
  parking: text("parking"),
  heatingSystem: text("heatingSystem"),
  approvalDate: text("approvalDate"),
  landType: text("landType"),
  zoneType: text("zoneType"),
  dealType: text("dealType"),
  deposit: text("deposit"),
  depositAmount: text("depositAmount"),
  monthlyRent: text("monthlyRent"),
  maintenanceFee: text("maintenanceFee"),
  ownerName: text("ownerName"),
  ownerPhone: text("ownerPhone"),
  tenantName: text("tenantName"),
  tenantPhone: text("tenantPhone"),
  clientName: text("clientName"),
  clientPhone: text("clientPhone"),
  specialNote: text("specialNote"),
  coListing: integer("coListing", { mode: "boolean" }).default(false),
  agentName: text("agentName"),
  propertyDescription: text("propertyDescription"),
  privateNote: text("privateNote"),
  youtubeUrl: text("youtubeUrl"),
  isSold: integer("isSold", { mode: "boolean" }).default(false),
  viewCount: integer("viewCount").default(0),
  isLongTerm: integer("isLongTerm", { mode: "boolean" }).default(false),
  longTermOrder: integer("longTermOrder").default(0),
  latitude: real("latitude"),
  longitude: real("longitude"),
  ownerId: integer("ownerId"),
  atclNo: text("atclNo")
});
var insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true
}).extend({
  price: z.union([z.string(), z.number()]).optional().transform((val) => val === "" || val === void 0 || val === null ? "0" : String(val))
});
var agents = sqliteTable("agents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  position: text("position"),
  photo: text("photo"),
  bio: text("bio"),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  createdAt: text("createdAt")
});
var insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true
});
var inquiries = sqliteTable("inquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  message: text("message").notNull(),
  inquiryType: text("inquiryType").notNull(),
  propertyId: integer("propertyId"),
  createdAt: text("createdAt")
});
var insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true
});
var users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").default("user").notNull(),
  nickname: text("nickname"),
  profileImage: text("profileImage"),
  birthDate: text("birthDate"),
  birthTime: text("birthTime"),
  isLunar: integer("isLunar", { mode: "boolean" }).default(false),
  businessName: text("businessName"),
  businessLicenseNo: text("businessLicenseNo"),
  businessAddress: text("businessAddress"),
  isVerified: integer("isVerified", { mode: "boolean" }).default(false),
  subscriptionTier: text("subscriptionTier").default("free"),
  subscriptionExpiresAt: text("subscriptionExpiresAt"),
  createdAt: text("createdAt")
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  phone: true,
  role: true,
  nickname: true,
  birthDate: true,
  birthTime: true,
  isLunar: true,
  businessName: true,
  businessLicenseNo: true,
  businessAddress: true
});
var news = sqliteTable("news", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  source: text("source").notNull(),
  sourceUrl: text("sourceUrl").notNull(),
  url: text("url").notNull(),
  imageUrl: text("imageUrl"),
  category: text("category").notNull(),
  isPinned: integer("isPinned", { mode: "boolean" }).default(false),
  createdAt: text("createdAt")
});
var insertNewsSchema = createInsertSchema(news).omit({
  id: true,
  createdAt: true
});
var propertyInquiries = sqliteTable("property_inquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  propertyId: integer("propertyId").notNull(),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isReply: integer("isReply", { mode: "boolean" }).default(false).notNull(),
  parentId: integer("parentId"),
  isReadByAdmin: integer("isReadByAdmin", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("createdAt")
});
var insertPropertyInquirySchema = createInsertSchema(propertyInquiries).omit({
  id: true,
  createdAt: true
});
var favorites = sqliteTable("favorites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  propertyId: integer("propertyId").notNull(),
  createdAt: text("createdAt").notNull()
});
var insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true
});
var notices = sqliteTable("notices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrls: text("imageUrls", { mode: "json" }).$type(),
  isPinned: integer("isPinned", { mode: "boolean" }).default(false),
  viewCount: integer("viewCount").default(0),
  createdAt: text("createdAt"),
  updatedAt: text("updatedAt")
});
var insertNoticeSchema = createInsertSchema(notices).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });
var posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("free"),
  authorId: integer("authorId").notNull(),
  authorName: text("authorName"),
  imageUrls: text("imageUrls", { mode: "json" }).$type(),
  viewCount: integer("viewCount").default(0),
  likeCount: integer("likeCount").default(0),
  commentCount: integer("commentCount").default(0),
  isPinned: integer("isPinned", { mode: "boolean" }).default(false),
  createdAt: text("createdAt"),
  updatedAt: text("updatedAt")
});
var insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true, likeCount: true, commentCount: true });
var banners = sqliteTable("banners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  imageUrl: text("imageUrl").notNull(),
  linkUrl: text("linkUrl"),
  location: text("location").notNull().default("left"),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  displayOrder: integer("displayOrder").default(0),
  createdAt: text("createdAt")
});
var insertBannerSchema = createInsertSchema(banners).omit({ id: true, createdAt: true });
var newsletterSubscriptions = sqliteTable("newsletter_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  name: text("name"),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  createdAt: text("createdAt")
});
var insertNewsletterSubscriptionSchema = createInsertSchema(newsletterSubscriptions).omit({ id: true, createdAt: true });
var realtorSubscriptions = sqliteTable("realtor_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  planType: text("planType").notNull(),
  amount: integer("amount").notNull(),
  impUid: text("impUid"),
  merchantUid: text("merchantUid"),
  status: text("status").default("active").notNull(),
  startDate: text("startDate"),
  endDate: text("endDate"),
  createdAt: text("createdAt")
});
var insertRealtorSubscriptionSchema = createInsertSchema(realtorSubscriptions).omit({ id: true, createdAt: true });
var notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  isRead: integer("isRead", { mode: "boolean" }).default(false),
  linkUrl: text("linkUrl"),
  createdAt: text("createdAt")
});
var insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
var crawledProperties = sqliteTable("crawled_properties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  atclNo: text("atclNo").notNull().unique(),
  atclNm: text("atclNm"),
  rletTpNm: text("rletTpNm"),
  tradTpNm: text("tradTpNm"),
  flrInfo: text("flrInfo"),
  prc: text("prc"),
  spc1: text("spc1"),
  spc2: text("spc2"),
  direction: text("direction"),
  lat: real("lat"),
  lng: real("lng"),
  imgUrl: text("imgUrl"),
  rltrNm: text("rltrNm"),
  landType: text("landType"),
  zoneType: text("zoneType"),
  crawledAt: text("crawledAt")
});
var insertCrawledPropertySchema = createInsertSchema(crawledProperties).omit({ id: true });

// server/db.ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
var dbPath = path.join(process.cwd(), "database.sqlite");
console.log(`[DB] Connecting to SQLite at: ${dbPath} (Bridging to modern UI)`);
var sqlite = new Database(dbPath, {
  verbose: console.log
});
var db = drizzle(sqlite, { schema: schema_exports });

// server/storage.ts
import { eq, desc, asc, and, gte, lte, inArray } from "drizzle-orm";
import session from "express-session";
import createSqliteStore from "better-sqlite3-session-store";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
var SqliteStore = createSqliteStore(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new SqliteStore({
      client: sqlite,
      expired: {
        clear: true,
        intervalMs: 9e5
        // 15 minutes
      }
    });
  }
  // Property methods
  async getProperties() {
    const results = await db.select().from(properties).where(eq(properties.isVisible, true)).orderBy(asc(properties.displayOrder), desc(properties.createdAt));
    return results.map((property) => ({
      ...property,
      imageUrls: typeof property.imageUrls === "string" ? JSON.parse(property.imageUrls) : property.imageUrls || []
    }));
  }
  async getAllProperties() {
    const results = await db.select().from(properties).orderBy(asc(properties.displayOrder), desc(properties.createdAt));
    return results.map((property) => ({
      ...property,
      imageUrls: typeof property.imageUrls === "string" ? JSON.parse(property.imageUrls) : property.imageUrls || []
    }));
  }
  async getProperty(id) {
    const result = await db.select().from(properties).where(eq(properties.id, id));
    if (!result[0]) return void 0;
    return {
      ...result[0],
      imageUrls: typeof result[0].imageUrls === "string" ? JSON.parse(result[0].imageUrls) : result[0].imageUrls || []
    };
  }
  async getFeaturedProperties(limit = 20) {
    const results = await db.select().from(properties).where(and(eq(properties.featured, true), eq(properties.isVisible, true))).orderBy(asc(properties.displayOrder), desc(properties.createdAt)).limit(limit);
    return results.map((property) => ({
      ...property,
      imageUrls: typeof property.imageUrls === "string" ? JSON.parse(property.imageUrls) : property.imageUrls || []
    }));
  }
  async getPropertiesByType(type) {
    const results = await db.select().from(properties).where(and(eq(properties.type, type), eq(properties.isVisible, true))).orderBy(asc(properties.displayOrder), desc(properties.createdAt));
    return results.map((property) => ({
      ...property,
      imageUrls: typeof property.imageUrls === "string" ? JSON.parse(property.imageUrls) : property.imageUrls || []
    }));
  }
  async getPropertiesByDistrict(district) {
    const results = await db.select().from(properties).where(and(eq(properties.district, district), eq(properties.isVisible, true))).orderBy(asc(properties.displayOrder), desc(properties.createdAt));
    return results.map((property) => ({
      ...property,
      imageUrls: typeof property.imageUrls === "string" ? JSON.parse(property.imageUrls) : property.imageUrls || []
    }));
  }
  async getPropertiesByPriceRange(min, max) {
    const results = await db.select().from(properties).where(
      and(
        gte(properties.price, min.toString()),
        lte(properties.price, max.toString()),
        eq(properties.isVisible, true)
      )
    ).orderBy(asc(properties.displayOrder), desc(properties.createdAt));
    return results.map((property) => ({
      ...property,
      imageUrls: typeof property.imageUrls === "string" ? JSON.parse(property.imageUrls) : property.imageUrls || []
    }));
  }
  async getPropertiesByAddresses(addresses) {
    if (addresses.length === 0) return [];
    const results = await db.select().from(properties).where(inArray(properties.address, addresses));
    return results.map((property) => ({
      ...property,
      imageUrls: typeof property.imageUrls === "string" ? JSON.parse(property.imageUrls) : property.imageUrls || []
    }));
  }
  async createProperty(property) {
    const propertyWithDefaultValues = {
      ...property,
      imageUrls: JSON.stringify(property.imageUrls || []),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const [result] = await db.insert(properties).values(propertyWithDefaultValues).returning();
    return {
      ...result,
      imageUrls: typeof result.imageUrls === "string" ? JSON.parse(result.imageUrls) : result.imageUrls || []
    };
  }
  async updateProperty(id, property) {
    const updateData = { ...property };
    if (property.imageUrls) {
      updateData.imageUrls = JSON.stringify(property.imageUrls);
    }
    const [result] = await db.update(properties).set(updateData).where(eq(properties.id, id)).returning();
    if (!result) return void 0;
    return {
      ...result,
      imageUrls: typeof result.imageUrls === "string" ? JSON.parse(result.imageUrls) : result.imageUrls || []
    };
  }
  async deleteProperty(id) {
    const result = await db.delete(properties).where(eq(properties.id, id)).returning();
    return result.length > 0;
  }
  async updatePropertyOrder(propertyId, newOrder) {
    const result = await db.update(properties).set({ displayOrder: newOrder }).where(eq(properties.id, propertyId)).returning();
    return result.length > 0;
  }
  async togglePropertyVisibility(propertyId, isVisible) {
    const result = await db.update(properties).set({ isVisible }).where(eq(properties.id, propertyId)).returning();
    return result.length > 0;
  }
  async togglePropertyFeatured(propertyId, featured) {
    const result = await db.update(properties).set({ featured }).where(eq(properties.id, propertyId)).returning();
    return result.length > 0;
  }
  // Agent methods
  async getAgents() {
    return await db.select().from(agents).where(eq(agents.isActive, true)).orderBy(asc(agents.id));
  }
  async getAgent(id) {
    const result = await db.select().from(agents).where(eq(agents.id, id));
    return result[0];
  }
  async createAgent(agent) {
    const [result] = await db.insert(agents).values({
      ...agent,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }).returning();
    return result;
  }
  async updateAgent(id, agent) {
    const [result] = await db.update(agents).set(agent).where(eq(agents.id, id)).returning();
    return result;
  }
  async deleteAgent(id) {
    const result = await db.delete(agents).where(eq(agents.id, id)).returning();
    return result.length > 0;
  }
  // Inquiry methods
  async getInquiries() {
    return await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
  }
  async getInquiry(id) {
    const result = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return result[0];
  }
  async createInquiry(inquiry) {
    const [result] = await db.insert(inquiries).values({
      ...inquiry,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }).returning();
    return result;
  }
  // User methods
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  async getUserByUsername(username) {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  async createUser(insertUser) {
    const [result] = await db.insert(users).values({
      ...insertUser,
      role: insertUser.role || "user",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }).returning();
    return result;
  }
  async getAllUsers() {
    return await db.select().from(users);
  }
  async updateUser(id, userData) {
    const [result] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return result;
  }
  async deleteUser(id) {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }
  // News methods
  async getNews() {
    try {
      return await db.select().from(news).orderBy(desc(news.createdAt));
    } catch (error) {
      console.error("Error fetching news:", error);
      return [];
    }
  }
  async getLatestNews(limit = 6) {
    try {
      return await db.select().from(news).orderBy(desc(news.createdAt)).limit(limit);
    } catch (error) {
      console.error("Error fetching latest news:", error);
      return [];
    }
  }
  async getNewsById(id) {
    try {
      const result = await db.select().from(news).where(eq(news.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching news by id:", error);
      return void 0;
    }
  }
  async getNewsByCategory(category) {
    try {
      return await db.select().from(news).where(eq(news.category, category)).orderBy(desc(news.createdAt));
    } catch (error) {
      console.error("Error fetching news by category:", error);
      return [];
    }
  }
  async createNews(newsItem) {
    try {
      const [result] = await db.insert(news).values({
        ...newsItem,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }).returning();
      return result;
    } catch (error) {
      console.error("Error creating news:", error);
      throw error;
    }
  }
  async updateNews(id, newsItem) {
    try {
      const [result] = await db.update(news).set(newsItem).where(eq(news.id, id)).returning();
      return result;
    } catch (error) {
      console.error("Error updating news:", error);
      return void 0;
    }
  }
  async deleteNews(id) {
    try {
      const result = await db.delete(news).where(eq(news.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting news:", error);
      return false;
    }
  }
  // 초기 데이터 설정
  async initializeData() {
    const adminUser = await this.getUserByUsername("admin");
    if (!adminUser) {
      await this.createUser({
        username: "admin",
        password: await hashPassword("adminpass"),
        role: "admin"
      });
      await this.createUser({
        username: "user",
        password: await hashPassword("userpass"),
        role: "user"
      });
      await this.createAgent({
        name: "\uC774\uAC00\uC774\uBC84\uBD80\uB3D9\uC0B0",
        phone: "010-1234-5678",
        email: "eguyer@example.com",
        isActive: true
      });
    }
  }
  // Property Inquiry methods
  async getPropertyInquiries(propertyId) {
    try {
      const result = await db.select({
        id: propertyInquiries.id,
        propertyId: propertyInquiries.propertyId,
        userId: propertyInquiries.userId,
        title: propertyInquiries.title,
        content: propertyInquiries.content,
        isReply: propertyInquiries.isReply,
        parentId: propertyInquiries.parentId,
        createdAt: propertyInquiries.createdAt,
        authorUsername: users.username
      }).from(propertyInquiries).leftJoin(users, eq(propertyInquiries.userId, users.id)).where(eq(propertyInquiries.propertyId, propertyId)).orderBy(desc(propertyInquiries.createdAt));
      return result;
    } catch (error) {
      console.error("Error getting property inquiries:", error);
      return [];
    }
  }
  async getPropertyInquiry(id) {
    try {
      const [inquiry] = await db.select().from(propertyInquiries).where(eq(propertyInquiries.id, id));
      return inquiry;
    } catch (error) {
      console.error("Error getting property inquiry:", error);
      return void 0;
    }
  }
  async createPropertyInquiry(inquiry) {
    try {
      const [createdInquiry] = await db.insert(propertyInquiries).values({
        ...inquiry,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }).returning();
      return createdInquiry;
    } catch (error) {
      console.error("Error creating property inquiry:", error);
      throw new Error("Failed to create property inquiry");
    }
  }
  async updatePropertyInquiry(id, inquiry) {
    try {
      const [updatedInquiry] = await db.update(propertyInquiries).set(inquiry).where(eq(propertyInquiries.id, id)).returning();
      return updatedInquiry;
    } catch (error) {
      console.error("Error updating property inquiry:", error);
      return void 0;
    }
  }
  async deletePropertyInquiry(id) {
    try {
      await db.delete(propertyInquiries).where(eq(propertyInquiries.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting property inquiry:", error);
      return false;
    }
  }
  // 관심 매물 (Favorites) 메서드
  async getUserFavorites(userId) {
    try {
      return await db.select().from(favorites).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
    } catch (error) {
      console.error("Error fetching user favorites:", error);
      return [];
    }
  }
  async getFavoriteProperties(userId) {
    try {
      const favs = await db.select({
        propertyId: favorites.propertyId
      }).from(favorites).where(eq(favorites.userId, userId));
      if (favs.length === 0) return [];
      const propertyIds = favs.map((f) => f.propertyId);
      const results = await db.select().from(properties).where(inArray(properties.id, propertyIds));
      return results.map((property) => ({
        ...property,
        imageUrls: typeof property.imageUrls === "string" ? JSON.parse(property.imageUrls) : property.imageUrls || []
      }));
    } catch (error) {
      console.error("Error fetching favorite properties:", error);
      return [];
    }
  }
  async isFavorite(userId, propertyId) {
    try {
      const result = await db.select().from(favorites).where(and(
        eq(favorites.userId, userId),
        eq(favorites.propertyId, propertyId)
      ));
      return result.length > 0;
    } catch (error) {
      console.error("Error checking if property is favorite:", error);
      return false;
    }
  }
  async addFavorite(favorite) {
    try {
      const existing = await this.isFavorite(favorite.userId, favorite.propertyId);
      if (existing) {
        throw new Error("\uC774\uBBF8 \uAD00\uC2EC \uB9E4\uBB3C\uB85C \uB4F1\uB85D\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.");
      }
      const [result] = await db.insert(favorites).values({
        ...favorite,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }).returning();
      return result;
    } catch (error) {
      console.error("Error adding favorite:", error);
      throw error;
    }
  }
  async removeFavorite(userId, propertyId) {
    try {
      const result = await db.delete(favorites).where(and(
        eq(favorites.userId, userId),
        eq(favorites.propertyId, propertyId)
      )).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error removing favorite:", error);
      return false;
    }
  }
  // 미읽은 문의글 관련 메서드
  async getUnreadInquiries() {
    try {
      return sqlite.prepare(
        "SELECT * FROM property_inquiries WHERE isReadByAdmin = 0 OR isReadByAdmin IS NULL ORDER BY createdAt DESC"
      ).all();
    } catch {
      return [];
    }
  }
  async getUnreadInquiryCount() {
    try {
      const row = sqlite.prepare(
        "SELECT COUNT(*) as c FROM property_inquiries WHERE isReadByAdmin = 0 OR isReadByAdmin IS NULL"
      ).get();
      return row?.c || 0;
    } catch {
      return 0;
    }
  }
  async markInquiryAsRead(id) {
    try {
      sqlite.prepare("UPDATE property_inquiries SET isReadByAdmin = 1 WHERE id = ?").run(id);
      return true;
    } catch {
      return false;
    }
  }
  async markAllInquiriesAsRead() {
    try {
      sqlite.prepare("UPDATE property_inquiries SET isReadByAdmin = 1 WHERE isReadByAdmin = 0 OR isReadByAdmin IS NULL").run();
      return true;
    } catch {
      return false;
    }
  }
  // Newsletter methods
  async createNewsletterSubscription(subscription) {
    const [result] = await db.insert(newsletterSubscriptions).values({
      ...subscription,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }).returning();
    return result;
  }
  async getNewsletterSubscriptions() {
    return db.select().from(newsletterSubscriptions).orderBy(desc(newsletterSubscriptions.createdAt));
  }
  async deleteNewsletterSubscription(id) {
    const result = await db.delete(newsletterSubscriptions).where(eq(newsletterSubscriptions.id, id)).returning();
    return result.length > 0;
  }
  // Crawler methods
  async createCrawledProperty(property) {
    const [existing] = await db.select().from(crawledProperties).where(eq(crawledProperties.atclNo, property.atclNo));
    if (existing) {
      const [updated] = await db.update(crawledProperties).set({
        ...property,
        crawledAt: (/* @__PURE__ */ new Date()).toISOString()
      }).where(eq(crawledProperties.atclNo, property.atclNo)).returning();
      return updated;
    }
    const [inserted] = await db.insert(crawledProperties).values({
      ...property,
      crawledAt: (/* @__PURE__ */ new Date()).toISOString()
    }).returning();
    return inserted;
  }
  async getCrawledProperties() {
    return db.select().from(crawledProperties).orderBy(desc(crawledProperties.crawledAt)).limit(1e3);
  }
  async getCrawledProperty(atclNo) {
    const [result] = await db.select().from(crawledProperties).where(eq(crawledProperties.atclNo, atclNo));
    return result;
  }
  async clearCrawledProperties() {
    await db.delete(crawledProperties);
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z as z2 } from "zod";

// server/cache.ts
var MemoryCache = class {
  cache = /* @__PURE__ */ new Map();
  DEFAULT_TTL = 5 * 60 * 1e3;
  // 5분 기본 캐시 시간
  /**
   * 캐시에서 값을 가져옴
   * @param key 캐시 키
   * @returns 캐시된 값 또는 undefined (만료 또는 없음)
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expiry) {
      if (item) this.cache.delete(key);
      return void 0;
    }
    return item.value;
  }
  /**
   * 캐시에 값을 저장
   * @param key 캐시 키
   * @param value 저장할 값
   * @param ttl 캐시 유효 시간(ms), 기본값 5분
   */
  set(key, value, ttl = this.DEFAULT_TTL) {
    const now = Date.now();
    const expiry = now + ttl;
    this.cache.set(key, { value, expiry, timestamp: now });
  }
  /**
   * 캐시 항목이 생성된 시간을 반환
   * @param key 캐시 키
   * @returns 캐시 생성 시간(타임스탬프) 또는 undefined (캐시 없음)
   */
  getTimestamp(key) {
    const item = this.cache.get(key);
    return item ? item.timestamp : void 0;
  }
  /**
   * 특정 키의 캐시 삭제
   * @param key 삭제할 캐시 키
   */
  delete(key) {
    this.cache.delete(key);
  }
  /**
   * 특정 프리픽스로 시작하는 모든 캐시 삭제
   * @param prefix 캐시 키 프리픽스
   */
  deleteByPrefix(prefix) {
    Array.from(this.cache.keys()).forEach((key) => {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    });
  }
  /**
   * 모든 캐시 삭제
   */
  clear() {
    this.cache.clear();
  }
  /**
   * 만료된 모든 캐시 항목 삭제 (정리)
   */
  cleanup() {
    const now = Date.now();
    this.cache.forEach((item, key) => {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    });
  }
};
var memoryCache = new MemoryCache();
setInterval(() => {
  memoryCache.cleanup();
}, 5 * 60 * 1e3);

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as NaverStrategy } from "passport-naver";
import { Strategy as KakaoStrategy } from "passport-kakao";
import session2 from "express-session";
import { scrypt as scrypt2, randomBytes as randomBytes2, timingSafeEqual } from "crypto";
import { promisify as promisify2 } from "util";
var scryptAsync2 = promisify2(scrypt2);
async function hashPassword2(password) {
  const salt = randomBytes2(16).toString("hex");
  const buf = await scryptAsync2(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync2(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
storage.initializeData().catch(console.error);
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "\uD55C\uAD6D\uBD80\uB3D9\uC0B0\uBE44\uBC00\uD0A4",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1e3,
      // 24시간
      httpOnly: true
    },
    store: storage.sessionStore
    // 세션 스토어 설정
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !await comparePasswords(password, user.password)) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  );
  if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
    passport.use(
      new NaverStrategy(
        {
          clientID: process.env.NAVER_CLIENT_ID,
          clientSecret: process.env.NAVER_CLIENT_SECRET,
          callbackURL: "/api/auth/naver/callback"
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const naverId = profile.id;
            let user = await storage.getUserByUsername(`naver_${naverId}`);
            if (!user) {
              const newUser = {
                username: `naver_${naverId}`,
                password: await hashPassword2(randomBytes2(16).toString("hex")),
                // 임의의 비밀번호
                email: profile.emails?.[0]?.value || "",
                phone: profile._json?.mobile || "",
                role: "user",
                provider: "naver",
                providerId: naverId
              };
              user = await storage.createUser(newUser);
            }
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }
  if (process.env.KAKAO_API_KEY) {
    passport.use(
      new KakaoStrategy(
        {
          clientID: process.env.KAKAO_API_KEY,
          callbackURL: "/api/auth/kakao/callback"
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const kakaoId = profile.id;
            let user = await storage.getUserByUsername(`kakao_${kakaoId}`);
            if (!user) {
              const newUser = {
                username: `kakao_${kakaoId}`,
                password: await hashPassword2(randomBytes2(16).toString("hex")),
                // 임의의 비밀번호
                email: profile._json?.kakao_account?.email || "",
                phone: "",
                role: "user",
                provider: "kakao",
                providerId: kakaoId
              };
              user = await storage.createUser(newUser);
            }
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "\uC774\uBBF8 \uC874\uC7AC\uD558\uB294 \uC544\uC774\uB514\uC785\uB2C8\uB2E4." });
      }
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword2(req.body.password),
        role: req.body.role || "user"
        // 기본적으로 일반 사용자 역할 부여
      });
      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "\uC544\uC774\uB514 \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." });
      req.login(user, (err2) => {
        if (err2) return next(err2);
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  const isAdmin = (req, res, next) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "\uAD00\uB9AC\uC790 \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." });
    }
    next();
  };
  app2.get("/api/admin/users", isAdmin, async (req, res, next) => {
    try {
      const users2 = await storage.getAllUsers();
      const usersWithoutPasswords = users2.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });
  app2.patch("/api/users/profile", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const userId = req.user.id;
      const { currentPassword, password, email, phone } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      if (password) {
        if (!currentPassword) {
          return res.status(400).json({ message: "\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694." });
        }
        const isPasswordValid = await comparePasswords(currentPassword, user.password);
        if (!isPasswordValid) {
          return res.status(400).json({ message: "\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." });
        }
      }
      const updateData = {};
      if (password) {
        updateData.password = await hashPassword2(password);
      }
      if (email !== void 0) {
        updateData.email = email;
      }
      if (phone !== void 0) {
        updateData.phone = phone;
      }
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(500).json({ message: "\uC0AC\uC6A9\uC790 \uC815\uBCF4 \uC5C5\uB370\uC774\uD2B8\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." });
      }
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  app2.patch("/api/users/password", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uC640 \uC0C8 \uBE44\uBC00\uBC88\uD638\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      const isPasswordCorrect = await comparePasswords(currentPassword, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({ message: "\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." });
      }
      const hashedPassword = await hashPassword2(newPassword);
      const updatedUser = await storage.updateUser(userId, { password: hashedPassword });
      if (!updatedUser) {
        return res.status(500).json({ message: "\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." });
      }
      res.json({ message: "\uBE44\uBC00\uBC88\uD638\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch (error) {
      next(error);
    }
  });
  app2.delete("/api/admin/users/:id", isAdmin, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790 ID\uC785\uB2C8\uB2E4." });
      }
      if (userId === req.user.id) {
        return res.status(400).json({ message: "\uAD00\uB9AC\uC790\uB294 \uC790\uC2E0\uC758 \uACC4\uC815\uC744 \uC0AD\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "\uD574\uB2F9 \uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      res.status(200).json({ message: "\uC0AC\uC6A9\uC790\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/auth/naver", passport.authenticate("naver"));
  app2.get(
    "/api/auth/naver/callback",
    passport.authenticate("naver", {
      failureRedirect: "/auth?error=naver_login_failed"
    }),
    (req, res) => {
      res.redirect("/");
    }
  );
  app2.get("/api/auth/kakao", passport.authenticate("kakao"));
  app2.get(
    "/api/auth/kakao/callback",
    passport.authenticate("kakao", {
      failureRedirect: "/auth?error=kakao_login_failed"
    }),
    (req, res) => {
      res.redirect("/");
    }
  );
}

// server/news-fetcher.ts
import fetch2 from "node-fetch";

// server/vite.ts
import express from "express";
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// server/news-fetcher.ts
import * as cheerio from "cheerio";
var SEARCH_ENDPOINT = "https://openapi.naver.com/v1/search/news.json";
var REAL_ESTATE_IMAGES = [
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1523217582562-09d0def993a6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500"
];
var SEARCH_KEYWORDS = [
  "\uAC15\uD654\uAD70 \uBD80\uB3D9\uC0B0",
  "\uAC15\uD654\uB3C4 \uBD80\uB3D9\uC0B0",
  "\uAC15\uD654\uAD70 \uAC1C\uBC1C",
  "\uAC15\uD654\uB3C4 \uC804\uC6D0\uC8FC\uD0DD",
  "\uAC15\uD654\uB3C4 \uD1A0\uC9C0",
  "\uC778\uCC9C \uAC15\uD654 \uAC1C\uBC1C",
  "\uAC15\uD654\uAD70 \uB274\uC2A4",
  "\uAC15\uD654\uAD70 \uC18C\uC2DD",
  "\uAC15\uD654\uB3C4 \uCD95\uC81C",
  "\uAC15\uD654\uAD70 \uAD50\uD1B5",
  "\uAC15\uD654\uAD70\uCCAD",
  "\uAC15\uD654\uB3C4 \uAD00\uAD11"
];
async function fetchNaverNews(keyword) {
  try {
    const response = await fetch2(`${SEARCH_ENDPOINT}?query=${encodeURIComponent(keyword)}&display=5&sort=date`, {
      headers: {
        "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID || "",
        "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET || ""
      }
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    log(`\uB124\uC774\uBC84 \uB274\uC2A4 API \uD638\uCD9C \uC624\uB958: ${error}`, "error");
    return [];
  }
}
function stripHtmlTags(html) {
  let text2 = html.replace(/<\/?[^>]+(>|$)/g, "");
  const entities = {
    "&quot;": '"',
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " ",
    "&#039;": "'",
    "&#39;": "'",
    "&ldquo;": '"',
    "&rdquo;": '"',
    "&hellip;": "...",
    "&middot;": "\xB7"
  };
  Object.entries(entities).forEach(([entity, replacement]) => {
    text2 = text2.replace(new RegExp(entity, "g"), replacement);
  });
  return text2;
}
async function isNewsAlreadyExists(title) {
  const news3 = await storage.getNewsByTitle(title);
  return !!news3;
}
var globalProcessedTitles = /* @__PURE__ */ new Set();
var globalProcessedLinks = /* @__PURE__ */ new Set();
var globalSimilaritySet = /* @__PURE__ */ new Map();
async function isSimilarNewsExists(title) {
  const normalizedTitle = title.toLowerCase().replace(/[^\w\s가-힣]/g, "");
  if (globalProcessedTitles.has(normalizedTitle)) {
    return true;
  }
  const words = normalizedTitle.split(/\s+/).filter((word) => word.length >= 3);
  const entries = Array.from(globalSimilaritySet.entries());
  for (let i = 0; i < entries.length; i++) {
    const [keyword, titles] = entries[i];
    if (normalizedTitle.includes(keyword) || words.some((word) => keyword.includes(word))) {
      return true;
    }
  }
  globalProcessedTitles.add(normalizedTitle);
  return false;
}
function hasTooManyRepeatedWords(title) {
  const cleanedTitle = title.replace(/[^a-zA-Z0-9가-힣\s]/g, "").toLowerCase();
  const words = cleanedTitle.split(/\s+/).filter((word) => word.length > 1);
  const wordCount = {};
  for (const word of words) {
    wordCount[word] = (wordCount[word] || 0) + 1;
  }
  for (const word in wordCount) {
    if (wordCount[word] >= 3) {
      return true;
    }
  }
  return false;
}
async function extractImageFromNews(url) {
  try {
    const response = await fetch2(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    let imageUrl = null;
    const naverNewsImage = $("#articleBodyContents img, #newsEndContents img, .end_photo_org img").first();
    if (naverNewsImage.length) {
      imageUrl = naverNewsImage.attr("src") || null;
    }
    if (!imageUrl) {
      const metaImage = $('meta[property="og:image"]').attr("content");
      if (metaImage) {
        imageUrl = metaImage;
      }
    }
    if (!imageUrl) {
      const firstImage = $("article img, .article img, .news_body img").first();
      if (firstImage.length) {
        imageUrl = firstImage.attr("src") || null;
      }
    }
    if (imageUrl && !imageUrl.startsWith("http")) {
      if (imageUrl.startsWith("//")) {
        imageUrl = "https:" + imageUrl;
      } else {
        const baseUrl = new URL(url);
        imageUrl = `${baseUrl.protocol}//${baseUrl.host}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
      }
    }
    return imageUrl;
  } catch (error) {
    return null;
  }
}
async function saveNewsToDatabase(newsItems) {
  let savedCount = 0;
  const sessionProcessedTitles = /* @__PURE__ */ new Set();
  const sessionProcessedLinks = /* @__PURE__ */ new Set();
  const shuffledItems = [...newsItems].sort(() => Math.random() - 0.5);
  for (const item of shuffledItems) {
    try {
      const cleanTitle = stripHtmlTags(item.title);
      const cleanDesc = stripHtmlTags(item.description);
      const sourceLink = item.originallink || item.link;
      const normalizedLink = sourceLink.replace(/\/$/, "");
      if (sessionProcessedTitles.has(cleanTitle)) continue;
      if (sessionProcessedLinks.has(normalizedLink)) continue;
      if (globalProcessedLinks.has(normalizedLink)) continue;
      sessionProcessedTitles.add(cleanTitle);
      sessionProcessedLinks.add(normalizedLink);
      globalProcessedLinks.add(normalizedLink);
      const exists = await isNewsAlreadyExists(cleanTitle);
      if (exists) continue;
      const similarExists = await isSimilarNewsExists(cleanTitle);
      if (similarExists) continue;
      if (hasTooManyRepeatedWords(cleanTitle)) continue;
      let imageUrl = await extractImageFromNews(item.link);
      if (!imageUrl) {
        const randomImageIndex = Math.floor(Math.random() * REAL_ESTATE_IMAGES.length);
        imageUrl = REAL_ESTATE_IMAGES[randomImageIndex];
      }
      try {
        await storage.createNews({
          title: cleanTitle,
          summary: cleanDesc,
          description: cleanDesc,
          content: `${cleanDesc}

\uC6D0\uBCF8 \uAE30\uC0AC: ${item.link}`,
          source: new URL(sourceLink).hostname,
          sourceUrl: sourceLink,
          url: item.link,
          imageUrl,
          category: "\uC778\uCC9C \uBD80\uB3D9\uC0B0",
          isPinned: false
        });
        log(`\uC0C8\uB85C\uC6B4 \uB274\uC2A4 \uC800\uC7A5\uB428: ${cleanTitle}`, "info");
        savedCount++;
        if (savedCount >= 3) break;
      } catch (dbError) {
        log(`\uB274\uC2A4 DB \uC800\uC7A5 \uC624\uB958 (${cleanTitle}): ${dbError}`, "error");
        continue;
      }
    } catch (error) {
      log(`\uB274\uC2A4 \uCC98\uB9AC \uC624\uB958: ${error}`, "error");
    }
  }
  return savedCount;
}
async function filterExistingNewsByRepeatedWords() {
  try {
    const allNews = await storage.getNews();
    let removedCount = 0;
    for (const newsItem of allNews) {
      if (hasTooManyRepeatedWords(newsItem.title)) {
        await storage.deleteNews(newsItem.id);
        removedCount++;
      }
    }
    if (removedCount > 0) {
      log(`\uCD1D ${removedCount}\uAC1C\uC758 \uC911\uBCF5 \uB2E8\uC5B4\uAC00 \uB9CE\uC740 \uB274\uC2A4\uB97C \uC0AD\uC81C\uD588\uC2B5\uB2C8\uB2E4.`, "info");
    }
  } catch (error) {
    console.error("\uAE30\uC874 \uB274\uC2A4 \uD544\uD130\uB9C1 \uC911 \uC624\uB958:", error);
  }
}
async function fetchAndSaveNews() {
  log(`\uB274\uC2A4 \uC218\uC9D1 \uC2DC\uC791: ${(/* @__PURE__ */ new Date()).toLocaleString()}`, "info");
  await filterExistingNewsByRepeatedWords();
  if (!process.env.NAVER_CLIENT_ID) {
    log("\uB124\uC774\uBC84 API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC544 \uB274\uC2A4 \uC218\uC9D1\uC744 \uAC74\uB108\uB701\uB2C8\uB2E4.", "info");
    return [];
  }
  let allNewsItems = [];
  for (const keyword of SEARCH_KEYWORDS) {
    const newsItems = await fetchNaverNews(keyword);
    allNewsItems = [...allNewsItems, ...newsItems];
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  const titleSet = /* @__PURE__ */ new Set();
  const uniqueNewsItems = [];
  for (const item of allNewsItems) {
    const t = stripHtmlTags(item.title);
    if (!titleSet.has(t)) {
      titleSet.add(t);
      uniqueNewsItems.push(item);
    }
  }
  const savedCount = await saveNewsToDatabase(uniqueNewsItems);
  log(`\uB274\uC2A4 \uC218\uC9D1 \uC644\uB8CC: ${savedCount}\uAC1C \uC800\uC7A5\uB428`, "info");
  return uniqueNewsItems.slice(0, 3);
}
function setupNewsScheduler() {
  log(`[info] \uB274\uC2A4 \uC790\uB3D9 \uC5C5\uB370\uC774\uD2B8 \uC2A4\uCF00\uC904\uB7EC \uCD08\uAE30\uD654`, "info");
  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
    log("[warn] \uB124\uC774\uBC84 API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC544 \uB274\uC2A4 \uC790\uB3D9 \uC218\uC9D1\uC774 \uBE44\uD65C\uC131\uD654\uB429\uB2C8\uB2E4.", "warn");
    return;
  }
  fetchAndSaveNews().catch((err) => log(`\uCD08\uAE30 \uB274\uC2A4 \uC218\uC9D1 \uC2E4\uD328: ${err}`, "error"));
  const CHECK_INTERVAL = 60 * 1e3;
  let lastRunIdentifier = "";
  setInterval(() => {
    const now = /* @__PURE__ */ new Date();
    const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1e3;
    const kstOffset = 9 * 60 * 60 * 1e3;
    const kstDate = new Date(utcNow + kstOffset);
    const currentHour = kstDate.getHours();
    const currentMinute = kstDate.getMinutes();
    if (currentHour % 3 === 0 && currentMinute < 20) {
      const currentIdentifier = `${kstDate.getFullYear()}-${kstDate.getMonth()}-${kstDate.getDate()}-${currentHour}`;
      if (lastRunIdentifier !== currentIdentifier) {
        log(`[scheduler] \uC815\uAE30 \uB274\uC2A4 \uC218\uC9D1 \uC2DC\uC791 (KST ${currentHour}\uC2DC - 3\uC2DC\uAC04 \uAC04\uACA9)`, "info");
        lastRunIdentifier = currentIdentifier;
        fetchAndSaveNews().catch((err) => log(`\uC815\uAE30 \uB274\uC2A4 \uC218\uC9D1 \uC2E4\uD328: ${err}`, "error"));
      }
    }
  }, CHECK_INTERVAL);
  log(`[info] \uB274\uC2A4 \uC2A4\uCF00\uC904\uB7EC \uC124\uC815 \uC644\uB8CC (\uB9E4 3\uC2DC\uAC04\uB9C8\uB2E4 \uC2E4\uD589)`, "info");
}

// server/mailer.ts
import nodemailer from "nodemailer";
var transporter = nodemailer.createTransport({
  host: "smtp.naver.com",
  port: 465,
  // 포트 465로 변경 (SSL/TLS 사용)
  secure: true,
  // true는 포트 465를 사용할 때, false는 다른 포트에서 사용
  auth: {
    user: process.env.NAVER_EMAIL,
    pass: process.env.NAVER_APP_PASSWORD
    // 애플리케이션 비밀번호 사용
  },
  debug: true,
  // 디버깅 모드 활성화
  logger: true
  // 로깅 활성화
});
console.log("SMTP \uC124\uC815 \uC815\uBCF4:", {
  host: "smtp.naver.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NAVER_EMAIL ? "\uC124\uC815\uB428" : "\uBBF8\uC124\uC815",
    pass: process.env.NAVER_APP_PASSWORD ? "\uC124\uC815\uB428" : "\uBBF8\uC124\uC815"
  }
});
async function sendEmail(to, subject, htmlContent) {
  try {
    console.log("\uC774\uBA54\uC77C \uC804\uC1A1 \uC2DC\uB3C4...");
    if (!process.env.NAVER_EMAIL || !process.env.NAVER_APP_PASSWORD) {
      console.error("\uB124\uC774\uBC84 \uBA54\uC77C \uC778\uC99D \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
      return false;
    }
    if (!to || to.trim() === "") {
      console.error("\uC218\uC2E0\uC790 \uC774\uBA54\uC77C \uC8FC\uC18C\uAC00 \uBE44\uC5B4\uC788\uC2B5\uB2C8\uB2E4.");
      return false;
    }
    console.log(`\uBC1C\uC2E0\uC790: ${process.env.NAVER_EMAIL}`);
    console.log(`\uC218\uC2E0\uC790: ${to}`);
    console.log(`\uC81C\uBAA9: ${subject}`);
    const rawEmail = process.env.NAVER_EMAIL || "";
    const naverEmail = rawEmail.includes("@") ? rawEmail : `${rawEmail}@naver.com`;
    console.log("\uBCF4\uC815\uB41C \uBC1C\uC2E0\uC790 \uC774\uBA54\uC77C:", naverEmail);
    const mailOptions = {
      from: naverEmail,
      // 단순 이메일 주소만 사용
      to: to.trim(),
      subject,
      html: htmlContent
    };
    console.log("SMTP \uC11C\uBC84\uB85C \uC804\uC1A1 \uC911...");
    const info = await transporter.sendMail(mailOptions);
    console.log("\uC774\uBA54\uC77C \uC804\uC1A1 \uC131\uACF5:", info);
    return true;
  } catch (error) {
    console.error("\uC774\uBA54\uC77C \uC804\uC1A1 \uC2E4\uD328 - \uC0C1\uC138 \uC624\uB958:", error);
    if (error instanceof Error) {
      console.error("\uC624\uB958 \uBA54\uC2DC\uC9C0:", error.message);
      console.error("\uC624\uB958 \uC2A4\uD0DD:", error.stack);
    }
    return false;
  }
}
function createInquiryEmailTemplate(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
      <h2 style="color: #3b82f6; margin-bottom: 20px;">\uC0C8\uB85C\uC6B4 \uBB38\uC758\uAC00 \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4</h2>
      
      <div style="margin-bottom: 15px;">
        <strong>\uC774\uB984:</strong> ${data.name}
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>\uC774\uBA54\uC77C:</strong> ${data.email}
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>\uC804\uD654\uBC88\uD638:</strong> ${data.phone}
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>\uBB38\uC758\uB0B4\uC6A9:</strong>
        <p style="background-color: #f9f9f9; padding: 10px; border-radius: 4px;">${data.message.replace(/\n/g, "<br>")}</p>
      </div>
      
      <div style="font-size: 12px; color: #666; margin-top: 30px; padding-top: 10px; border-top: 1px solid #e1e1e1;">
        <p>\uC774 \uC774\uBA54\uC77C\uC740 \uC774\uAC00\uC774\uBC84\uBD80\uB3D9\uC0B0 \uC6F9\uC0AC\uC774\uD2B8\uC758 \uBB38\uC758 \uD3FC\uC5D0\uC11C \uC790\uB3D9\uC73C\uB85C \uC804\uC1A1\uB418\uC5C8\uC2B5\uB2C8\uB2E4.</p>
      </div>
    </div>
  `;
}

// server/real-estate-api.ts
import fetch3 from "node-fetch";
import { XMLParser } from "fast-xml-parser";
var DEBUG_API_CALLS = true;
async function getApartmentTransactions(params) {
  const baseUrl = "http://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTradeDev";
  const serviceKey = process.env.DATA_GO_KR_API_KEY;
  if (!serviceKey) {
    throw new Error("DATA_GO_KR_API_KEY \uD658\uACBD\uBCC0\uC218\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
  }
  const cacheKey = `apartment-transactions-${params.LAWD_CD}-${params.DEAL_YMD}`;
  const cachedData = memoryCache.get(cacheKey);
  if (cachedData) {
    console.log(`\uCE90\uC2DC\uB41C \uC544\uD30C\uD2B8 \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uBC18\uD658: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    return cachedData;
  }
  const url = `${baseUrl}?serviceKey=${serviceKey}&LAWD_CD=${params.LAWD_CD}&DEAL_YMD=${params.DEAL_YMD}`;
  try {
    console.log(`\uC544\uD30C\uD2B8 \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC694\uCCAD: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    console.log("\uC694\uCCAD URL:", url);
    const response = await fetch3(url, {
      method: "GET",
      headers: {
        "Accept": "application/xml",
        "Content-Type": "application/xml",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) {
      console.error(`HTTP \uC624\uB958: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP \uC624\uB958: ${response.status}`);
    }
    const xmlData = await response.text();
    if (DEBUG_API_CALLS) {
      console.log("API \uC751\uB2F5 \uC804\uCCB4:", xmlData);
    } else {
      console.log("API \uC751\uB2F5 \uC77C\uBD80:", xmlData.substring(0, 300));
    }
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text"
    });
    const result = parser.parse(xmlData);
    console.log("\uD30C\uC2F1\uB41C \uACB0\uACFC \uAD6C\uC870:", JSON.stringify(result).substring(0, 300));
    if (!result.response) {
      console.error("API \uC751\uB2F5 \uD615\uC2DD \uC624\uB958: response \uAC1D\uCCB4 \uC5C6\uC74C");
      return [];
    }
    const resultCode = result.response.header?.resultCode;
    if (resultCode && resultCode !== "00") {
      const errorMsg = result.response.header?.resultMsg || "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958";
      console.error(`API \uC624\uB958: ${errorMsg}`);
      return [];
    }
    if (!result.response.body?.items?.item) {
      console.log("API \uC751\uB2F5: \uB370\uC774\uD130 \uC5C6\uC74C");
      return [];
    }
    let items = [];
    if (Array.isArray(result.response.body.items.item)) {
      items = result.response.body.items.item;
    } else {
      items = [result.response.body.items.item];
    }
    const transactions = items.map((item) => {
      const legalDong = item.\uBC95\uC815\uB3D9 || "";
      const jibun = item.\uC9C0\uBC88 || "";
      const address = `\uC778\uCC9C \uAC15\uD654\uAD70 ${legalDong} ${jibun}`;
      let dealAmount = item.\uAC70\uB798\uAE08\uC561 || "";
      if (typeof dealAmount === "string") {
        dealAmount = dealAmount.trim().replace(/,/g, "");
      }
      return {
        \uAC70\uB798\uAE08\uC561: dealAmount,
        \uAC74\uCD95\uB144\uB3C4: item.\uAC74\uCD95\uB144\uB3C4,
        \uB144: item.\uB144,
        \uC6D4: item.\uC6D4,
        \uC77C: item.\uC77C,
        \uC544\uD30C\uD2B8: item.\uC544\uD30C\uD2B8,
        \uC804\uC6A9\uBA74\uC801: item.\uC804\uC6A9\uBA74\uC801,
        \uBC95\uC815\uB3D9: legalDong,
        \uC9C0\uBC88: jibun,
        \uC9C0\uC5ED\uCF54\uB4DC: item.\uC9C0\uC5ED\uCF54\uB4DC,
        \uCE35: item.\uCE35,
        type: "\uC544\uD30C\uD2B8",
        address
      };
    });
    memoryCache.set(cacheKey, transactions, 2 * 60 * 60 * 1e3);
    console.log(`${transactions.length}\uAC1C\uC758 \uC544\uD30C\uD2B8 \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC870\uD68C \uC644\uB8CC`);
    return transactions;
  } catch (error) {
    console.error("\uC544\uD30C\uD2B8 \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC870\uD68C \uC624\uB958:", error);
    return [];
  }
}
async function getHouseTransactions(params) {
  const baseUrl = "http://openapi.molit.go.kr:8081/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcSHTrade";
  const serviceKey = process.env.DATA_GO_KR_API_KEY;
  if (!serviceKey) {
    throw new Error("DATA_GO_KR_API_KEY \uD658\uACBD\uBCC0\uC218\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
  }
  const cacheKey = `house-transactions-${params.LAWD_CD}-${params.DEAL_YMD}`;
  const cachedData = memoryCache.get(cacheKey);
  if (cachedData) {
    console.log(`\uCE90\uC2DC\uB41C \uB2E8\uB3C5\uB2E4\uAC00\uAD6C \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uBC18\uD658: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    return cachedData;
  }
  const url = `${baseUrl}?serviceKey=${serviceKey}&LAWD_CD=${params.LAWD_CD}&DEAL_YMD=${params.DEAL_YMD}`;
  try {
    console.log(`\uB2E8\uB3C5\uB2E4\uAC00\uAD6C \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC694\uCCAD: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    console.log("\uC694\uCCAD URL:", url);
    const response = await fetch3(url, {
      method: "GET",
      headers: {
        "Accept": "application/xml",
        "Content-Type": "application/xml",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) {
      console.error(`HTTP \uC624\uB958: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP \uC624\uB958: ${response.status}`);
    }
    const xmlData = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text"
    });
    const result = parser.parse(xmlData);
    if (!result.response) {
      console.error("API \uC751\uB2F5 \uD615\uC2DD \uC624\uB958: response \uAC1D\uCCB4 \uC5C6\uC74C");
      return [];
    }
    const resultCode = result.response.header?.resultCode;
    if (resultCode && resultCode !== "00") {
      const errorMsg = result.response.header?.resultMsg || "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958";
      console.error(`API \uC624\uB958: ${errorMsg}`);
      return [];
    }
    if (!result.response.body?.items?.item) {
      console.log("API \uC751\uB2F5: \uB370\uC774\uD130 \uC5C6\uC74C");
      return [];
    }
    let items = [];
    if (Array.isArray(result.response.body.items.item)) {
      items = result.response.body.items.item;
    } else {
      items = [result.response.body.items.item];
    }
    const transactions = items.map((item) => {
      const legalDong = item.\uBC95\uC815\uB3D9 || "";
      const jibun = item.\uC9C0\uBC88 || "";
      const address = `\uC778\uCC9C \uAC15\uD654\uAD70 ${legalDong} ${jibun}`;
      let dealAmount = item.\uAC70\uB798\uAE08\uC561 || "";
      if (typeof dealAmount === "string") {
        dealAmount = dealAmount.trim().replace(/,/g, "");
      }
      return {
        \uAC70\uB798\uAE08\uC561: dealAmount,
        \uAC74\uCD95\uB144\uB3C4: item.\uAC74\uCD95\uB144\uB3C4,
        \uB144: item.\uB144,
        \uC6D4: item.\uC6D4,
        \uC77C: item.\uC77C,
        \uC8FC\uD0DD\uC720\uD615: item.\uC8FC\uD0DD\uC720\uD615,
        \uC804\uC6A9\uBA74\uC801: item.\uC5F0\uBA74\uC801,
        // 단독주택은 연면적을 사용함
        \uBC95\uC815\uB3D9: legalDong,
        \uC9C0\uBC88: jibun,
        type: "\uB2E8\uB3C5\uB2E4\uAC00\uAD6C",
        address
      };
    });
    memoryCache.set(cacheKey, transactions, 2 * 60 * 60 * 1e3);
    console.log(`${transactions.length}\uAC1C\uC758 \uB2E8\uB3C5\uB2E4\uAC00\uAD6C \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC870\uD68C \uC644\uB8CC`);
    return transactions;
  } catch (error) {
    console.error("\uB2E8\uB3C5\uB2E4\uAC00\uAD6C \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC870\uD68C \uC624\uB958:", error);
    return [];
  }
}
async function getLandTransactions(params) {
  const baseUrl = "http://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcLandTrade";
  const serviceKey = process.env.DATA_GO_KR_API_KEY;
  if (!serviceKey) {
    throw new Error("DATA_GO_KR_API_KEY \uD658\uACBD\uBCC0\uC218\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
  }
  const cacheKey = `land-transactions-${params.LAWD_CD}-${params.DEAL_YMD}`;
  const cachedData = memoryCache.get(cacheKey);
  if (cachedData) {
    console.log(`\uCE90\uC2DC\uB41C \uD1A0\uC9C0 \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uBC18\uD658: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    return cachedData;
  }
  const url = `${baseUrl}?serviceKey=${serviceKey}&LAWD_CD=${params.LAWD_CD}&DEAL_YMD=${params.DEAL_YMD}`;
  try {
    console.log(`\uD1A0\uC9C0 \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC694\uCCAD: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    console.log("\uC694\uCCAD URL:", url);
    const response = await fetch3(url, {
      method: "GET",
      headers: {
        "Accept": "application/xml",
        "Content-Type": "application/xml",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) {
      console.error(`HTTP \uC624\uB958: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP \uC624\uB958: ${response.status}`);
    }
    const xmlData = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text"
    });
    const result = parser.parse(xmlData);
    if (!result.response) {
      console.error("API \uC751\uB2F5 \uD615\uC2DD \uC624\uB958: response \uAC1D\uCCB4 \uC5C6\uC74C");
      return [];
    }
    const resultCode = result.response.header?.resultCode;
    if (resultCode && resultCode !== "00") {
      const errorMsg = result.response.header?.resultMsg || "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958";
      console.error(`API \uC624\uB958: ${errorMsg}`);
      return [];
    }
    if (!result.response.body?.items?.item) {
      console.log("API \uC751\uB2F5: \uB370\uC774\uD130 \uC5C6\uC74C");
      return [];
    }
    let items = [];
    if (Array.isArray(result.response.body.items.item)) {
      items = result.response.body.items.item;
    } else {
      items = [result.response.body.items.item];
    }
    const transactions = items.map((item) => {
      const legalDong = item.\uBC95\uC815\uB3D9 || "";
      const jibun = item.\uC9C0\uBC88 || "";
      const address = `\uC778\uCC9C \uAC15\uD654\uAD70 ${legalDong} ${jibun}`;
      let dealAmount = item.\uAC70\uB798\uAE08\uC561 || "";
      if (typeof dealAmount === "string") {
        dealAmount = dealAmount.trim().replace(/,/g, "");
      }
      return {
        \uAC70\uB798\uAE08\uC561: dealAmount,
        \uB144: item.\uB144,
        \uC6D4: item.\uC6D4,
        \uC77C: item.\uC77C,
        \uD1A0\uC9C0\uAC70\uB798\uAD6C\uBD84: item.\uD1A0\uC9C0\uAC70\uB798\uAD6C\uBD84,
        \uBC95\uC815\uB3D9: legalDong,
        \uC9C0\uBC88: jibun,
        type: "\uD1A0\uC9C0",
        address
      };
    });
    memoryCache.set(cacheKey, transactions, 2 * 60 * 60 * 1e3);
    console.log(`${transactions.length}\uAC1C\uC758 \uD1A0\uC9C0 \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC870\uD68C \uC644\uB8CC`);
    return transactions;
  } catch (error) {
    console.error("\uD1A0\uC9C0 \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC870\uD68C \uC624\uB958:", error);
    return [];
  }
}
async function getRecentTransactions(regionCode = "28710") {
  try {
    console.log(`\uC2E4\uAC70\uB798\uAC00 \uB370\uC774\uD130 \uC694\uCCAD: \uC9C0\uC5ED\uCF54\uB4DC=${regionCode}`);
    const today = /* @__PURE__ */ new Date();
    const months = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      months.push(`${year}${month}`);
    }
    console.log(`\uCD5C\uADFC 3\uAC1C\uC6D4 \uB370\uC774\uD130 \uC870\uD68C: ${months.join(", ")}`);
    const allTransactionsPromises = months.flatMap((month) => [
      getApartmentTransactions({ LAWD_CD: regionCode, DEAL_YMD: month }),
      getHouseTransactions({ LAWD_CD: regionCode, DEAL_YMD: month }),
      getLandTransactions({ LAWD_CD: regionCode, DEAL_YMD: month })
    ]);
    const allTransactions = await Promise.all(allTransactionsPromises);
    const transactions = allTransactions.flat();
    console.log(`\uCD1D ${transactions.length}\uAC1C\uC758 \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC870\uD68C \uC644\uB8CC`);
    return transactions;
  } catch (error) {
    console.error("\uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC870\uD68C \uC624\uB958:", error);
    return [];
  }
}

// server/test-api.ts
import fetch4 from "node-fetch";
async function testRealEstateAPI() {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    console.error("DATA_GO_KR_API_KEY \uD658\uACBD\uBCC0\uC218\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
    return;
  }
  console.log("\uC0C8\uB85C\uC6B4 API \uD0A4:", apiKey.substring(0, 10) + "...");
  const tests = [
    {
      name: "\uD1A0\uC9C0 \uC2E4\uAC70\uB798\uAC00 API (\uC0C8\uB85C\uC6B4 \uC2A4\uD0C0\uC77C)",
      url: `https://api.odcloud.kr/api/RltmTradeInfoLandService/v1/getMTransaction?serviceKey=${apiKey}&page=1&perPage=10&LAWD_CD=28710&DEAL_YMD=202311`
    },
    {
      name: "\uC544\uD30C\uD2B8 \uC2E4\uAC70\uB798\uAC00 API (\uC0C8\uB85C\uC6B4 \uC2A4\uD0C0\uC77C)",
      url: `https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail?serviceKey=${apiKey}&page=1&perPage=10`
    },
    {
      name: "\uB2E8\uB3C5/\uB2E4\uAC00\uAD6C \uC2E4\uAC70\uB798\uAC00 API (\uAD6C \uC2A4\uD0C0\uC77C)",
      url: `http://openapi.molit.go.kr:8081/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcSHTrade?serviceKey=${apiKey}&LAWD_CD=28710&DEAL_YMD=202311`
    },
    {
      name: "\uD1A0\uC9C0 \uC2E4\uAC70\uB798\uAC00 API + \uC778\uCF54\uB529 \uD0A4 (\uC2E0 \uC2A4\uD0C0\uC77C)",
      url: `https://apis.data.go.kr/1613000/RTMSDataSvcLandTrade/getLandTrade?serviceKey=${apiKey}&LAWD_CD=28710&DEAL_YMD=202503&numOfRows=10&pageNo=1`
    },
    {
      name: "\uC544\uD30C\uD2B8 \uC2E4\uAC70\uB798\uAC00 API + \uC778\uCF54\uB529 \uD0A4 (\uC2E0 \uC2A4\uD0C0\uC77C)",
      url: `https://apis.data.go.kr/1613000/AptTradeSvc/getAptTrade?serviceKey=${apiKey}&LAWD_CD=28710&DEAL_YMD=202503&numOfRows=10&pageNo=1`
    },
    {
      name: "\uB0A0\uC528 API \uD14C\uC2A4\uD2B8",
      url: `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${apiKey}&numOfRows=10&pageNo=1&base_date=20240514&base_time=0600&nx=55&ny=127`
    }
  ];
  for (const test of tests) {
    console.log(`

\uD14C\uC2A4\uD2B8: ${test.name}`);
    console.log(`URL: ${test.url}`);
    try {
      const response = await fetch4(test.url, {
        method: "GET",
        headers: {
          "Accept": "application/xml",
          "Content-Type": "application/xml",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        }
      });
      console.log(`\uC0C1\uD0DC \uCF54\uB4DC: ${response.status} ${response.statusText}`);
      const text2 = await response.text();
      console.log(`\uC751\uB2F5 \uC77C\uBD80: ${text2.substring(0, 300)}...`);
      if (text2.includes("<OpenAPI_ServiceResponse>")) {
        console.log("\u2705 API \uC751\uB2F5 \uD615\uC2DD \uD655\uC778\uB428: OpenAPI_ServiceResponse \uD3EC\uD568");
      } else if (text2.includes("<response>")) {
        console.log("\u2705 API \uC751\uB2F5 \uD615\uC2DD \uD655\uC778\uB428: response \uD3EC\uD568");
      } else if (!text2.includes("<?xml")) {
        console.log("\u274C XML \uD615\uC2DD\uC774 \uC544\uB2D8");
      } else {
        console.log("\u2753 \uC54C \uC218 \uC5C6\uB294 \uC751\uB2F5 \uD615\uC2DD");
      }
      if (text2.includes("SERVICE ERROR") || text2.includes("SERVICE_KEY_IS_NOT_REGISTERED")) {
        console.log("\u274C \uC11C\uBE44\uC2A4 \uD0A4 \uC624\uB958 \uD3EC\uD568\uB428");
      } else if (text2.includes("LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS")) {
        console.log("\u274C \uC694\uCCAD \uD69F\uC218 \uCD08\uACFC\uB428");
      } else if (text2.includes("NO_MANDATORY_REQUEST_PARAMETERS_ERROR")) {
        console.log("\u274C \uD544\uC218 \uD30C\uB77C\uBBF8\uD130 \uB204\uB77D\uB428");
      } else if (text2.includes("INVALID_REQUEST_PARAMETER_ERROR")) {
        console.log("\u274C \uC798\uBABB\uB41C \uD30C\uB77C\uBBF8\uD130 \uAC12");
      }
    } catch (error) {
      console.error(`\u274C \uC624\uB958 \uBC1C\uC0DD: ${error}`);
    }
  }
}

// server/routes.ts
init_blog_fetcher();

// server/youtube-fetcher.ts
import fetch6 from "node-fetch";
async function getChannelIdByHandle(handle) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("YouTube API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
    }
    const cleanHandle = handle.startsWith("@") ? handle.substring(1) : handle;
    console.log(`YouTube \uD578\uB4E4\uB85C \uCC44\uB110 ID \uC870\uD68C: @${cleanHandle}`);
    const response = await fetch6(
      `https://www.googleapis.com/youtube/v3/channels?part=id,contentDetails&forHandle=${encodeURIComponent(cleanHandle)}&key=${apiKey}`
    );
    if (!response.ok) {
      throw new Error(`\uCC44\uB110 \uC870\uD68C \uC2E4\uD328: ${response.status}`);
    }
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      console.log(`\uCC44\uB110 ID \uCC3E\uC74C: ${data.items[0].id}`);
      return data.items[0].id;
    }
    return null;
  } catch (error) {
    console.error("\uCC44\uB110 ID \uC870\uD68C \uC624\uB958:", error);
    return null;
  }
}
function extractChannelId(channelUrl) {
  const match = channelUrl.match(/channel\/([^/?]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return "UCCG3_JlKhgalqhict7tKkbA";
}
async function fetchYouTubeShorts(channelId, limit = 10) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("YouTube API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
    }
    console.log(`YouTube \uC1FC\uCE20 \uAC80\uC0C9: \uCC44\uB110 ${channelId}`);
    const searchResponse = await fetch6(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&videoDuration=short&maxResults=${limit}&order=date&key=${apiKey}`
    );
    if (!searchResponse.ok) {
      throw new Error(`\uC1FC\uCE20 \uAC80\uC0C9 \uC2E4\uD328: ${searchResponse.status}`);
    }
    const searchData = await searchResponse.json();
    if (!searchData.items || searchData.items.length === 0) {
      console.log("\uC1FC\uCE20\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      return [];
    }
    console.log(`${searchData.items.length}\uAC1C\uC758 \uC1FC\uCE20\uB97C \uCC3E\uC558\uC2B5\uB2C8\uB2E4.`);
    const shorts = searchData.items.map((item) => {
      const thumbnailUrl = item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`;
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: thumbnailUrl,
        url: `https://www.youtube.com/shorts/${item.id.videoId}`,
        publishedAt: item.snippet.publishedAt
      };
    });
    return shorts;
  } catch (error) {
    console.error("YouTube \uC1FC\uCE20 \uAC80\uC0C9 \uC624\uB958:", error);
    return [];
  }
}
async function fetchLatestYouTubeVideosWithAPI(channelId, limit = 5) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("YouTube API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
    }
    console.log(`YouTube API\uB97C \uC0AC\uC6A9\uD558\uC5EC \uCC44\uB110 \uC815\uBCF4 \uC694\uCCAD: ${channelId}`);
    const channelResponse = await fetch6(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
    );
    if (!channelResponse.ok) {
      throw new Error(`\uCC44\uB110 \uC815\uBCF4 \uC694\uCCAD \uC2E4\uD328: ${channelResponse.status} ${channelResponse.statusText}`);
    }
    const channelData = await channelResponse.json();
    if (!channelData.items || channelData.items.length === 0) {
      throw new Error("\uCC44\uB110 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4");
    }
    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
    console.log(`\uCC44\uB110 \uC5C5\uB85C\uB4DC \uC7AC\uC0DD\uBAA9\uB85D ID: ${uploadsPlaylistId}`);
    const playlistResponse = await fetch6(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${limit}&playlistId=${uploadsPlaylistId}&key=${apiKey}`
    );
    if (!playlistResponse.ok) {
      throw new Error(`\uC7AC\uC0DD\uBAA9\uB85D \uC694\uCCAD \uC2E4\uD328: ${playlistResponse.status} ${playlistResponse.statusText}`);
    }
    const playlistData = await playlistResponse.json();
    if (!playlistData.items) {
      console.log("\uC7AC\uC0DD\uBAA9\uB85D\uC5D0\uC11C \uC601\uC0C1\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      return [];
    }
    console.log(`\uC7AC\uC0DD\uBAA9\uB85D\uC5D0\uC11C ${playlistData.items.length}\uAC1C\uC758 \uC601\uC0C1 \uC815\uBCF4\uB97C \uAC00\uC838\uC654\uC2B5\uB2C8\uB2E4.`);
    const videos = playlistData.items.map((item) => {
      const thumbnailUrl = item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || `https://i.ytimg.com/vi/${item.snippet.resourceId.videoId}/hqdefault.jpg`;
      return {
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        thumbnail: thumbnailUrl,
        url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        publishedAt: item.snippet.publishedAt
      };
    });
    console.log("YouTube API\uC5D0\uC11C \uC601\uC0C1 \uC815\uBCF4 \uAC00\uC838\uC624\uAE30 \uC131\uACF5");
    return videos;
  } catch (error) {
    console.error("YouTube API \uC694\uCCAD \uC624\uB958:", error);
    throw error;
  }
}
async function fetchLatestYouTubeVideos(channelUrl, limit = 5) {
  try {
    console.log(`\uC720\uD29C\uBE0C \uCC44\uB110 \uC815\uBCF4 \uC694\uCCAD: ${channelUrl}`);
    const channelId = extractChannelId(channelUrl);
    console.log(`\uCD94\uCD9C\uB41C \uCC44\uB110 ID: ${channelId}`);
    try {
      return await fetchLatestYouTubeVideosWithAPI(channelId, limit);
    } catch (apiError) {
      console.error("YouTube API \uC694\uCCAD \uC2E4\uD328, \uB300\uCCB4 \uB370\uC774\uD130 \uC0AC\uC6A9:", apiError);
      console.log(`YouTube RSS \uD53C\uB4DC\uB85C \uB300\uCCB4 \uC6B0\uD68C \uC2DC\uB3C4: ${channelId}`);
      try {
        const rssResponse = await fetch6(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
        if (!rssResponse.ok) throw new Error("RSS \uD53C\uB4DC \uC694\uCCAD \uC2E4\uD328");
        const rssText = await rssResponse.text();
        const videos = [];
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        let match;
        while ((match = entryRegex.exec(rssText)) !== null && videos.length < limit) {
          const entryStr = match[1];
          const idMatch = entryStr.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
          const titleMatch = entryStr.match(/<title>([^<]+)<\/title>/);
          const pubMatch = entryStr.match(/<published>([^<]+)<\/published>/);
          const thumbMatch = entryStr.match(/<media:thumbnail url="([^"]+)"/);
          if (idMatch && titleMatch) {
            const videoId = idMatch[1];
            const thumbnail = thumbMatch ? thumbMatch[1] : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            videos.push({
              id: videoId,
              title: titleMatch[1],
              thumbnail,
              url: `https://www.youtube.com/watch?v=${videoId}`,
              publishedAt: pubMatch ? pubMatch[1] : (/* @__PURE__ */ new Date()).toISOString()
            });
          }
        }
        if (videos.length > 0) {
          console.log(`RSS \uD53C\uB4DC\uB85C ${videos.length}\uAC1C \uC601\uC0C1 \uBCF5\uAD6C \uC644\uB8CC.`);
          return videos;
        }
      } catch (rssError) {
        console.error("RSS \uD53C\uB4DC \uC6B0\uD68C \uD30C\uC2F1\uB9C8\uC800 \uC2E4\uD328:", rssError);
      }
      return [];
    }
  } catch (error) {
    console.error("\uC720\uD29C\uBE0C \uC601\uC0C1 \uAC00\uC838\uC624\uAE30 \uC624\uB958:", error);
    return [];
  }
}
var youtubeCache = {
  videos: [],
  lastFetched: 0
};
var CACHE_TTL2 = 6 * 60 * 60 * 1e3;
async function getLatestYouTubeVideos(channelUrl, limit = 5) {
  const now = Date.now();
  if (youtubeCache.videos.length > 0 && now - youtubeCache.lastFetched < CACHE_TTL2) {
    console.log("\uCE90\uC2DC\uB41C \uC720\uD29C\uBE0C \uC601\uC0C1 \uC815\uBCF4 \uBC18\uD658");
    return youtubeCache.videos.slice(0, limit);
  }
  const videos = await fetchLatestYouTubeVideos(channelUrl, limit);
  if (videos.length > 0) {
    youtubeCache = {
      videos,
      lastFetched: now
    };
  }
  return videos;
}

// server/sheet-importer.ts
import { google } from "googleapis";

// server/image-resizer.ts
import * as fs from "fs";
import * as path2 from "path";
function convertGoogleDriveUrl(url) {
  const patterns = [
    /https:\/\/drive\.google\.com\/file\/d\/([^\/]+)\/view/,
    /https:\/\/drive\.google\.com\/file\/d\/([^\/]+)/,
    /https:\/\/drive\.google\.com\/open\?id=([^&]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const fileId = match[1].split("?")[0];
      const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      log(`Google Drive URL \uBCC0\uD658: ${url.substring(0, 60)}... -> ${directUrl}`, "info");
      return directUrl;
    }
  }
  return url;
}
async function resizeImageFromUrl(imageUrl) {
  try {
    if (!imageUrl || imageUrl.trim() === "") {
      return null;
    }
    let downloadUrl = imageUrl;
    if (imageUrl.includes("drive.google.com")) {
      downloadUrl = convertGoogleDriveUrl(imageUrl);
    }
    log(`\uC774\uBBF8\uC9C0 \uB2E4\uC6B4\uB85C\uB4DC \uC2DC\uC791: ${downloadUrl}`, "info");
    const response = await fetch(downloadUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      redirect: "follow"
    });
    if (!response.ok) {
      log(`\uC774\uBBF8\uC9C0 \uB2E4\uC6B4\uB85C\uB4DC \uC2E4\uD328: ${imageUrl}, \uC0C1\uD0DC: ${response.status}`, "warn");
      return null;
    }
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      log(`\uC774\uBBF8\uC9C0\uAC00 \uC544\uB2CC \uCF58\uD150\uCE20: ${imageUrl}, \uD0C0\uC785: ${contentType}`, "warn");
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const uploadsDir = path2.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const filepath = path2.join(uploadsDir, filename);
    fs.writeFileSync(filepath, imageBuffer);
    const savedUrl = `/uploads/${filename}`;
    log(`\uC774\uBBF8\uC9C0 \uC800\uC7A5 \uC644\uB8CC: ${imageUrl} -> ${savedUrl}`, "info");
    return savedUrl;
  } catch (error) {
    log(`\uC774\uBBF8\uC9C0 \uCC98\uB9AC \uC624\uB958: ${imageUrl}, \uC5D0\uB7EC: ${error}`, "error");
    return null;
  }
}
async function resizeImages(imageUrls) {
  const results = [];
  for (const url of imageUrls) {
    if (!url || url.trim() === "") {
      continue;
    }
    const savedUrl = await resizeImageFromUrl(url);
    if (savedUrl) {
      results.push(savedUrl);
    }
  }
  return results;
}

// server/sheet-importer.ts
var COL = {
  A: 0,
  // 날짜
  B: 1,
  // 지역 (district)
  C: 2,
  // 주소 (address)
  D: 3,
  // 지목 (landType)
  E: 4,
  // 용도지역 (zoneType)
  G: 6,
  // 건물명 (buildingName)
  H: 7,
  // 동호수 (unitNumber)
  J: 9,
  // 면적/공급면적 (size/supplyArea)
  M: 12,
  // 전용면적 (privateArea)
  O: 14,
  // 평형 (areaSize)
  P: 15,
  // 방개수 (bedrooms)
  Q: 16,
  // 욕실개수 (bathrooms)
  S: 18,
  // 층수 (floor)
  T: 19,
  // 총층 (totalFloors)
  U: 20,
  // 방향 (direction)
  V: 21,
  // 난방방식 (heatingSystem)
  X: 23,
  // 사용승인일 (approvalDate)
  Y: 24,
  // 유형 (type)
  AB: 27,
  // 승강기유무 (elevator) - "유"이면 체크, "무"이거나 빈값이면 비체크
  AC: 28,
  // 주차 (parking)
  AD: 29,
  // 거래종류 (dealType)
  AE: 30,
  // 가격 (price)
  AF: 31,
  // 전세금 (deposit)
  AG: 32,
  // 보증금 (depositAmount)
  AH: 33,
  // 월세 (monthlyRent)
  AI: 34,
  // 관리비 (maintenanceFee)
  AJ: 35,
  // 소유자 (ownerName)
  AK: 36,
  // 소유자전화 (ownerPhone)
  AL: 37,
  // 임차인 (tenantName)
  AM: 38,
  // 임차인전화 (tenantPhone)
  AN: 39,
  // 의뢰인 (clientName)
  AO: 40,
  // 의뢰인전화 (clientPhone)
  AP: 41,
  // 특이사항 (specialNote)
  AQ: 42,
  // 담당중개사 (agentName) - 텍스트로 저장
  AR: 43,
  // 매물설명 (propertyDescription)
  AS: 44,
  // 비공개메모 (privateNote)
  AT: 45,
  // 제목 (title)
  AU: 46,
  // 설명 (description)
  AV: 47,
  // 이미지1
  AW: 48,
  // 이미지2
  AX: 49,
  // 이미지3
  AY: 50,
  // 이미지4
  AZ: 51,
  // 이미지5
  BA: 52
  // 유튜브URL (youtubeUrl)
};
async function checkDuplicatesFromSheet(spreadsheetId, apiKey, range, filterDate) {
  try {
    const sheets = google.sheets({ version: "v4", auth: apiKey });
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { success: true, duplicates: [] };
    }
    const filterDateTime = new Date(filterDate);
    filterDateTime.setHours(0, 0, 0, 0);
    const addressMap = /* @__PURE__ */ new Map();
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 3) continue;
      const rowDateStr = row[COL.A]?.toString().trim();
      if (!rowDateStr) continue;
      let rowDate;
      if (rowDateStr.includes("/")) {
        const parts = rowDateStr.split("/");
        if (parts[0].length === 4) {
          rowDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          rowDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        }
      } else if (rowDateStr.includes("-")) {
        rowDate = new Date(rowDateStr);
      } else if (rowDateStr.includes(".")) {
        const parts = rowDateStr.split(".");
        if (parts[0].length === 4) {
          rowDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          rowDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        }
      } else {
        rowDate = new Date(rowDateStr);
        if (isNaN(rowDate.getTime())) continue;
      }
      rowDate.setHours(0, 0, 0, 0);
      if (rowDate < filterDateTime) continue;
      const address = row[COL.C]?.toString().trim();
      if (address) {
        addressMap.set(address, i + 2);
      }
    }
    if (addressMap.size === 0) {
      return { success: true, duplicates: [] };
    }
    const addresses = Array.from(addressMap.keys());
    const existingProperties = await storage.getPropertiesByAddresses(addresses);
    const duplicates = existingProperties.map((prop) => ({
      rowIndex: addressMap.get(prop.address) || 0,
      address: prop.address,
      existingPropertyId: prop.id,
      existingPropertyTitle: prop.title
    }));
    return { success: true, duplicates };
  } catch (error) {
    log(`\uC911\uBCF5 \uD655\uC778 \uC2E4\uD328: ${error}`, "error");
    return { success: false, error: `\uC911\uBCF5 \uD655\uC778 \uC2E4\uD328: ${error}` };
  }
}
async function importPropertiesFromSheet(spreadsheetId, apiKey, range = "\uD1A0\uC9C0!A2:BA", filterDate, skipAddresses = []) {
  try {
    const sheets = google.sheets({ version: "v4", auth: apiKey });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { success: false, error: "\uC2DC\uD2B8\uC5D0 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." };
    }
    log(`\uAD6C\uAE00 \uC2DC\uD2B8\uC5D0\uC11C ${rows.length}\uAC1C\uC758 \uD589\uC744 \uCC3E\uC558\uC2B5\uB2C8\uB2E4. (\uC2DC\uD2B8: ${range})`, "info");
    const filterDateTime = new Date(filterDate);
    filterDateTime.setHours(0, 0, 0, 0);
    log(`\uB0A0\uC9DC \uD544\uD130 \uC801\uC6A9: ${filterDate} \uC774\uD6C4\uC758 \uB370\uC774\uD130\uB9CC \uAC00\uC838\uC635\uB2C8\uB2E4.`, "info");
    const importedIds = [];
    const errors = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        if (row.length < 3) {
          errors.push(`\uD589 ${i + 2}: \uB370\uC774\uD130\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4.`);
          continue;
        }
        const rowDateStr = row[COL.A]?.toString().trim();
        if (!rowDateStr) {
          continue;
        }
        let rowDate;
        if (rowDateStr.includes("/")) {
          const parts = rowDateStr.split("/");
          if (parts[0].length === 4) {
            rowDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          } else {
            rowDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
          }
        } else if (rowDateStr.includes("-")) {
          rowDate = new Date(rowDateStr);
        } else if (rowDateStr.includes(".")) {
          const parts = rowDateStr.split(".");
          if (parts[0].length === 4) {
            rowDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          } else {
            rowDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
          }
        } else {
          rowDate = new Date(rowDateStr);
        }
        rowDate.setHours(0, 0, 0, 0);
        if (isNaN(rowDate.getTime())) {
          log(`\uD589 ${i + 2}: \uB0A0\uC9DC \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4 (${rowDateStr}), \uC2A4\uD0B5\uB428`, "warn");
          continue;
        }
        if (rowDate < filterDateTime) {
          continue;
        }
        log(`\uD589 ${i + 2}: \uB0A0\uC9DC \uD544\uD130 \uD1B5\uACFC (${rowDateStr} >= ${filterDate})`, "info");
        log(`\uD589 ${i + 2}: \uD328\uB529 \uC804 \uD589 \uAE38\uC774: ${row.length}`, "info");
        const originalAV = row[COL.AV] || "(\uC5C6\uC74C)";
        const originalAW = row[COL.AW] || "(\uC5C6\uC74C)";
        const originalAX = row[COL.AX] || "(\uC5C6\uC74C)";
        const originalAY = row[COL.AY] || "(\uC5C6\uC74C)";
        const originalAZ = row[COL.AZ] || "(\uC5C6\uC74C)";
        log(`\uD589 ${i + 2}: \uC6D0\uBCF8 \uC774\uBBF8\uC9C0 \uB370\uC774\uD130 - AV: "${String(originalAV).substring(0, 30)}", AW: "${String(originalAW).substring(0, 30)}", AX: "${String(originalAX).substring(0, 30)}"`, "info");
        const requiredLength = COL.BA + 1;
        while (row.length < requiredLength) {
          row.push("");
        }
        log(`\uD589 ${i + 2}: \uD328\uB529 \uD6C4 \uD589 \uAE38\uC774: ${row.length}`, "info");
        const rowAddress = row[COL.C]?.toString().trim();
        if (rowAddress && skipAddresses.includes(rowAddress)) {
          log(`\uD589 ${i + 2}: \uC911\uBCF5 \uB9E4\uBB3C\uB85C \uAC74\uB108\uB700 (\uC8FC\uC18C: ${rowAddress})`, "info");
          continue;
        }
        const getValue = (idx) => row[idx]?.toString().trim() || "";
        const getNumericValue = (idx) => {
          const val = getValue(idx);
          if (!val || val === "") return null;
          const numStr = val.replace(/[^0-9.-]/g, "");
          return numStr || null;
        };
        const getMoneyValue = (idx) => {
          const val = getNumericValue(idx);
          if (!val || val === "0") return null;
          const numericVal = parseFloat(val);
          if (isNaN(numericVal)) return null;
          return String(Math.round(numericVal * 1e4));
        };
        const getBooleanValue = (idx) => {
          const val = getValue(idx).toLowerCase();
          return val === "true" || val === "1" || val === "yes" || val === "\uC608" || val === "o";
        };
        const getElevatorValue = (idx) => {
          const val = getValue(idx).trim();
          return val === "\uC720";
        };
        const collectImageUrls = () => {
          const imageColumns = [COL.AV, COL.AW, COL.AX, COL.AY, COL.AZ];
          const urls = [];
          log(`[IMG] \uD589 ${i + 2}: \uD589\uAE38\uC774=${row.length}, AV(47)="${(row[47] || "").toString().substring(0, 60)}"`, "info");
          log(`[IMG] \uD589 ${i + 2}: AW(48)="${(row[48] || "").toString().substring(0, 60)}", AX(49)="${(row[49] || "").toString().substring(0, 60)}"`, "info");
          for (const col of imageColumns) {
            const rawValue = row[col];
            const url = rawValue?.toString().trim() || "";
            const cleanUrl = url.replace(/\s+/g, "");
            if (cleanUrl && cleanUrl.length > 0) {
              if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://") || cleanUrl.startsWith("//")) {
                const finalUrl = cleanUrl.startsWith("//") ? "https:" + cleanUrl : cleanUrl;
                log(`[IMG] \uD589 ${i + 2}: \uC5F4 ${col}\uC5D0\uC11C URL \uBC1C\uACAC: ${finalUrl.substring(0, 60)}...`, "info");
                urls.push(finalUrl);
              } else {
                log(`[IMG] \uD589 ${i + 2}: \uC5F4 ${col} URL\uD615\uC2DD \uC544\uB2D8: "${cleanUrl.substring(0, 40)}"`, "warn");
              }
            }
          }
          log(`[IMG] \uD589 ${i + 2}: \uCD1D ${urls.length}\uAC1C URL`, "info");
          return urls;
        };
        const dealTypeStr = getValue(COL.AD);
        let dealTypeArray = ["\uB9E4\uB9E4"];
        if (dealTypeStr) {
          dealTypeArray = dealTypeStr.split(",").map((s) => s.trim()).filter((s) => s);
          if (dealTypeArray.length === 0) dealTypeArray = ["\uB9E4\uB9E4"];
        }
        const originalImageUrls = collectImageUrls();
        let processedImageUrls = [];
        if (originalImageUrls.length > 0) {
          log(`\uD589 ${i + 2}: ${originalImageUrls.length}\uAC1C \uC774\uBBF8\uC9C0 \uB9AC\uC0AC\uC774\uC9D5 \uC2DC\uC791...`, "info");
          processedImageUrls = await resizeImages(originalImageUrls);
          log(`\uD589 ${i + 2}: \uC774\uBBF8\uC9C0 \uB9AC\uC0AC\uC774\uC9D5 \uC644\uB8CC (${processedImageUrls.length}\uAC1C)`, "info");
        }
        const propertyType = mapPropertyType(getValue(COL.Y));
        if (processedImageUrls.length === 0) {
          processedImageUrls = [getDefaultImageForPropertyType(propertyType)];
        }
        const propertyData = {
          title: getValue(COL.AT) || "\uC81C\uBAA9\uC744 \uC785\uB825\uD558\uC138\uC694",
          description: getValue(COL.AU) || getValue(COL.AR) || "",
          type: propertyType,
          price: (() => {
            const priceVal = getNumericValue(COL.AE);
            if (!priceVal || priceVal === "0") return "0";
            const numericPrice = parseFloat(priceVal);
            if (isNaN(numericPrice)) return "0";
            return String(Math.round(numericPrice * 1e4));
          })(),
          address: getValue(COL.C),
          district: getValue(COL.B),
          size: getNumericValue(COL.J) || "0",
          bedrooms: parseInt(getValue(COL.P)) || 0,
          bathrooms: parseInt(getValue(COL.Q)) || 0,
          // 위치 정보
          buildingName: getValue(COL.G) || null,
          unitNumber: getValue(COL.H) || null,
          // 면적 정보
          supplyArea: getNumericValue(COL.J),
          privateArea: getNumericValue(COL.M),
          areaSize: getValue(COL.O) || null,
          // 건물 정보
          floor: parseInt(getValue(COL.S)) || null,
          totalFloors: parseInt(getValue(COL.T)) || null,
          direction: getValue(COL.U) || null,
          elevator: getElevatorValue(COL.AB),
          // "유"이면 체크, "무"이거나 빈값이면 비체크
          parking: getValue(COL.AC) || null,
          heatingSystem: getValue(COL.V) || null,
          approvalDate: getValue(COL.X) || null,
          // 토지 정보
          landType: getValue(COL.D) || null,
          zoneType: getValue(COL.E) || null,
          // 금액 정보 (만원 → 원 변환)
          dealType: dealTypeArray,
          deposit: getMoneyValue(COL.AF),
          depositAmount: getMoneyValue(COL.AG),
          monthlyRent: getMoneyValue(COL.AH),
          maintenanceFee: getNumericValue(COL.AI),
          // 연락처 정보
          ownerName: getValue(COL.AJ) || null,
          ownerPhone: getValue(COL.AK) || null,
          tenantName: getValue(COL.AL) || null,
          tenantPhone: getValue(COL.AM) || null,
          clientName: getValue(COL.AN) || null,
          clientPhone: getValue(COL.AO) || null,
          // 추가 정보
          specialNote: getValue(COL.AP) || null,
          coListing: false,
          // 공동중개 기본값
          agentName: getValue(COL.AQ) || null,
          // 담당중개사 이름 (텍스트)
          propertyDescription: getValue(COL.AR) || null,
          privateNote: getValue(COL.AS) || null,
          youtubeUrl: getValue(COL.BA) || null,
          // 이미지 URL 처리 - 리사이징된 이미지 사용
          imageUrl: processedImageUrls[0],
          imageUrls: processedImageUrls,
          featured: false,
          displayOrder: 0,
          isVisible: true,
          agentId: 4
          // 기본값 4 (이민호)
        };
        if (!propertyData.title || !propertyData.address) {
          errors.push(`\uD589 ${i + 2}: \uD544\uC218 \uD544\uB4DC(\uC81C\uBAA9, \uC8FC\uC18C)\uAC00 \uB204\uB77D\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`);
          continue;
        }
        const savedProperty = await storage.createProperty(propertyData);
        importedIds.push(savedProperty.id);
        log(`\uD589 ${i + 2} \uC784\uD3EC\uD2B8 \uC131\uACF5: ${savedProperty.title} (ID: ${savedProperty.id})`, "info");
      } catch (rowError) {
        errors.push(`\uD589 ${i + 2} \uCC98\uB9AC \uC624\uB958: ${rowError}`);
        log(`\uD589 ${i + 2} \uCC98\uB9AC \uC624\uB958: ${rowError}`, "error");
      }
    }
    if (errors.length > 0) {
      log(`${errors.length}\uAC1C\uC758 \uD589\uC5D0\uC11C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ${errors.slice(0, 5).join("; ")}`, "error");
    }
    return {
      success: true,
      count: importedIds.length,
      importedIds,
      error: errors.length > 0 ? `${errors.length}\uAC1C\uC758 \uD589\uC5D0\uC11C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4` : void 0
    };
  } catch (error) {
    log(`\uAD6C\uAE00 \uC2DC\uD2B8 \uB370\uC774\uD130 \uAC00\uC838\uC624\uAE30 \uC2E4\uD328: ${error}`, "error");
    return { success: false, error: `\uAD6C\uAE00 \uC2DC\uD2B8 \uB370\uC774\uD130 \uAC00\uC838\uC624\uAE30 \uC2E4\uD328: ${error}` };
  }
}
function mapPropertyType(type) {
  const typeMap = {
    "\uD1A0\uC9C0": "\uD1A0\uC9C0",
    "\uB2E8\uB3C5": "\uB2E8\uB3C5",
    "\uB2E8\uB3C5\uC8FC\uD0DD": "\uB2E8\uB3C5",
    "\uC8FC\uD0DD": "\uB2E8\uB3C5",
    "\uADFC\uB9B0": "\uADFC\uB9B0",
    "\uADFC\uB9B0\uC0C1\uAC00": "\uADFC\uB9B0",
    "\uC544\uD30C\uD2B8": "\uC544\uD30C\uD2B8",
    "\uB2E4\uC138\uB300": "\uB2E4\uC138\uB300",
    "\uC5F0\uB9BD": "\uC5F0\uB9BD",
    "\uC6D0\uB8F8": "\uC6D0\uD22C\uB8F8",
    "\uD22C\uB8F8": "\uC6D0\uD22C\uB8F8",
    "\uC6D0\uD22C\uB8F8": "\uC6D0\uD22C\uB8F8",
    "\uB2E4\uAC00\uAD6C": "\uB2E4\uAC00\uAD6C",
    "\uC624\uD53C\uC2A4\uD154": "\uC624\uD53C\uC2A4\uD154",
    "\uC0C1\uAC00": "\uADFC\uB9B0",
    "\uACF5\uC7A5": "\uAE30\uD0C0",
    "\uCC3D\uACE0": "\uAE30\uD0C0",
    "\uD39C\uC158": "\uAE30\uD0C0",
    "\uAE30\uD0C0": "\uAE30\uD0C0"
  };
  const normalizedType = type.trim();
  if (typeMap[normalizedType]) {
    return typeMap[normalizedType];
  }
  for (const key in typeMap) {
    if (normalizedType.includes(key)) {
      return typeMap[key];
    }
  }
  return "\uAE30\uD0C0";
}
function getDefaultImageForPropertyType(type) {
  return "/uploads/default-property.png";
}

// server/services/naver-crawler.ts
import fetch7 from "node-fetch";
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "Accept": "application/json, text/javascript, */*; q=0.01",
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Referer": "https://m.land.naver.com/",
  "X-Requested-With": "XMLHttpRequest",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-site"
};
var GANGHWA_FULL_BOUNDS = {
  minLat: 37.58,
  minLon: 126.25,
  maxLat: 37.85,
  // 강화 북단(교동, 양사면 등) 포함
  maxLon: 126.54
  // 김포 경계까지 넉넉하게 확장 (좌표 필터링에서 정밀 제어)
};
var GANGHWA_PRECISION_BOUNDS = {
  minLat: 37.58,
  maxLat: 37.85,
  minLon: 126.25,
  maxLon: 126.525
  // 김포 매물 유입 방지
};
var NaverCrawler = class {
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async fetchAndSave(bounds) {
    const defaultBounds = {
      minLat: 37.73,
      minLon: 126.47,
      maxLat: 37.76,
      maxLon: 126.5
    };
    return this.crawlSingle(bounds || defaultBounds);
  }
  async fetchAndSaveGrid(bounds) {
    return this.crawlGrid(bounds || GANGHWA_FULL_BOUNDS);
  }
  async crawlGrid(bounds) {
    console.log(`[Crawler] Starting GRID crawl for: ${JSON.stringify(bounds)}`);
    const ROWS = 4;
    const COLS = 4;
    const latStep = (bounds.maxLat - bounds.minLat) / ROWS;
    const lonStep = (bounds.maxLon - bounds.minLon) / COLS;
    let totalSaved = 0;
    let totalFetched = 0;
    const processedSet = /* @__PURE__ */ new Set();
    for (let i = 0; i < ROWS; i++) {
      for (let j = 0; j < COLS; j++) {
        const fileMinLat = bounds.minLat + i * latStep;
        const fileMaxLat = fileMinLat + latStep;
        const fileMinLon = bounds.minLon + j * lonStep;
        const fileMaxLon = fileMinLon + lonStep;
        const sectorBounds = {
          minLat: fileMinLat,
          minLon: fileMinLon,
          maxLat: fileMaxLat,
          maxLon: fileMaxLon
        };
        console.log(`[Crawler] Sector ${i}-${j} started: ${JSON.stringify(sectorBounds)}`);
        try {
          const result = await this.crawlSingle(sectorBounds, processedSet);
          totalSaved += result.count;
          totalFetched += result.totalFetched;
          console.log(`[Crawler] Sector ${i}-${j} complete. Saved: ${result.count}, Total: ${totalSaved}`);
          await this.sleep(2e3);
        } catch (err) {
          console.error(`[Crawler] Sector ${i}-${j} failed:`, err);
          await this.sleep(5e3);
        }
      }
    }
    console.log(`[Crawler] FULL Grid crawl finished. Final Saved: ${totalSaved}`);
    return { success: true, count: totalSaved, totalFetched, message: "Grid crawl completed" };
  }
  async crawlSingle(bounds, processedSet) {
    const url = "https://m.land.naver.com/cluster/ajax/articleList";
    const localSet = processedSet || /* @__PURE__ */ new Set();
    const categoryGroups = [
      { rletTpCd: "DDD:SGJT:VL:JWJT:HOJT", label: "House" },
      { rletTpCd: "TJ:JGC:JW", label: "Land" },
      { rletTpCd: "SG:SMS", label: "Comm" }
    ];
    let savedCount = 0;
    let totalFetchedCount = 0;
    for (const group of categoryGroups) {
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 3) {
        const params = new URLSearchParams({
          rletTpCd: group.rletTpCd,
          tradTpCd: "A1:B1:B2",
          z: "12",
          lat: String((bounds.minLat + bounds.maxLat) / 2),
          lon: String((bounds.minLon + bounds.maxLon) / 2),
          btm: String(bounds.minLat),
          lft: String(bounds.minLon),
          top: String(bounds.maxLat),
          rgt: String(bounds.maxLon),
          sort: "rank",
          page: String(page),
          pgr: String(page)
          // 더블 파라미터로 페이징 보강
        });
        try {
          const response = await fetch7(`${url}?${params.toString()}`, {
            method: "GET",
            headers: HEADERS,
            redirect: "manual"
            // 리다이렉트를 수동으로 체크
          });
          if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
            const redirectUrl = response.headers.get("location");
            console.error(`[Crawler] ${group.label} P${page} Redirected to: ${redirectUrl}`);
            break;
          }
          if (!response.ok) {
            console.error(`[Crawler] ${group.label} P${page} Error: ${response.status}`);
            break;
          }
          const data = await response.json();
          const articles = data.body || [];
          totalFetchedCount += articles.length;
          for (const article of articles) {
            const atclNo = String(article.atclNo);
            if (localSet.has(atclNo)) continue;
            const lat = Number(article.lat);
            const lng = Number(article.lng);
            const isInGanghwa = lat >= GANGHWA_PRECISION_BOUNDS.minLat && lat <= GANGHWA_PRECISION_BOUNDS.maxLat && lng >= GANGHWA_PRECISION_BOUNDS.minLon && lng <= GANGHWA_PRECISION_BOUNDS.maxLon;
            if (!isInGanghwa) continue;
            try {
              const crawledItem = {
                atclNo,
                atclNm: article.atclFetrDesc || article.atclNm || "\uC81C\uBAA9 \uC5C6\uC74C",
                rletTpNm: article.rletTpNm,
                tradTpNm: article.tradTpNm,
                flrInfo: article.flrInfo,
                prc: String(article.prc),
                spc1: article.spc1 ? String(article.spc1) : null,
                spc2: article.spc2 ? String(article.spc2) : null,
                direction: article.direction,
                lat,
                lng,
                imgUrl: article.repImgUrl ? `https://landthumb-phinf.pstatic.net${article.repImgUrl}` : null,
                rltrNm: article.rltrNm || null,
                landType: article.atclNm || null,
                zoneType: article.flrInfo || null
              };
              await storage.createCrawledProperty(crawledItem);
              savedCount++;
              localSet.add(atclNo);
            } catch (err) {
            }
          }
          hasMore = data.more === true && articles.length > 0;
          if (hasMore) {
            page++;
            await this.sleep(1e3);
          } else {
            break;
          }
        } catch (error) {
          console.error(`[Crawler] Request Failed:`, error);
          break;
        }
      }
      await this.sleep(1e3);
    }
    return { success: true, count: savedCount, totalFetched: totalFetchedCount };
  }
};
var naverCrawler = new NaverCrawler();

// server/routes.ts
var siteConfig = {
  siteName: "\uC774\uAC00\uC774\uBC84 \uBD80\uB3D9\uC0B0",
  siteDescription: "\uAC15\uD654\uB3C4 \uBD80\uB3D9\uC0B0 \uC911\uAC1C \uC11C\uBE44\uC2A4",
  siteContactEmail: "contact@ganghwaestate.com"
};
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/site/config", (req, res) => {
    res.json(siteConfig);
  });
  app2.get("/api/properties", async (req, res) => {
    try {
      const skipCache = req.query.skipCache === "true";
      if (!skipCache) {
        const cacheKey = "properties_all";
        const cachedProperties = memoryCache.get(cacheKey);
        if (cachedProperties) {
          return res.json(cachedProperties);
        }
      }
      const properties2 = await storage.getProperties();
      if (!skipCache) {
        memoryCache.set("properties_all", properties2, 1 * 60 * 1e3);
      }
      res.json(properties2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });
  app2.get("/api/admin/properties", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const properties2 = await storage.getAllProperties();
      res.json(properties2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all properties" });
    }
  });
  const getCachedProperties = async () => {
    const cached = memoryCache.get("properties_all");
    if (cached) return cached;
    const properties2 = await storage.getProperties();
    memoryCache.set("properties_all", properties2, 60 * 1e3);
    return properties2;
  };
  app2.get("/api/properties/urgent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 4;
      const all = await getCachedProperties();
      const filtered = all.filter(
        (p) => p.title && (p.title.includes("\uAE09\uB9E4") || p.title.includes("\uC2DC\uAE09") || p.title.includes("\uAE34\uAE09"))
      ).slice(0, limit);
      res.json(filtered.length > 0 ? filtered : all.slice(0, limit));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch urgent properties" });
    }
  });
  app2.get("/api/properties/negotiable", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 4;
      const all = await getCachedProperties();
      const filtered = all.filter(
        (p) => p.title && (p.title.includes("\uD611\uC758") || p.title.includes("\uD765\uC815")) || p.price && p.price.includes("\uD611\uC758")
      ).slice(0, limit);
      res.json(filtered.length > 0 ? filtered : all.slice(Math.floor(all.length / 4), Math.floor(all.length / 4) + limit));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch negotiable properties" });
    }
  });
  app2.get("/api/properties/long-term", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 4;
      const all = await getCachedProperties();
      const filtered = all.filter(
        (p) => p.type && (p.type === "\uD1A0\uC9C0" || p.type === "\uC784\uC57C" || p.type === "\uB18D\uC9C0") || p.title && (p.title.includes("\uD22C\uC790") || p.title.includes("\uAC1C\uBC1C") || p.title.includes("\uC7A5\uAE30"))
      ).slice(0, limit);
      res.json(filtered.length > 0 ? filtered : all.slice(Math.floor(all.length / 2), Math.floor(all.length / 2) + limit));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch long-term properties" });
    }
  });
  app2.get("/api/properties/featured", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : void 0;
      const properties2 = await storage.getFeaturedProperties(limit);
      console.log(
        `\uCD94\uCC9C \uB9E4\uBB3C ${properties2.length}\uAC1C \uC870\uD68C\uB428:`,
        properties2.map((p) => `${p.id}:${p.title}(${p.featured ? "\uCD94\uCC9C" : "\uC77C\uBC18"})`)
      );
      res.json(properties2);
    } catch (error) {
      console.error("Error fetching featured properties:", error);
      res.status(500).json({ message: "Failed to fetch featured properties" });
    }
  });
  app2.get("/api/properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });
  app2.get("/api/properties/type/:type", async (req, res) => {
    try {
      const type = req.params.type;
      const properties2 = await storage.getPropertiesByType(type);
      res.json(properties2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties by type" });
    }
  });
  app2.get("/api/properties/district/:district", async (req, res) => {
    try {
      const district = req.params.district;
      const properties2 = await storage.getPropertiesByDistrict(district);
      res.json(properties2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties by district" });
    }
  });
  app2.get("/api/properties/price-range", async (req, res) => {
    try {
      const minParam = req.query.min;
      const maxParam = req.query.max;
      if (!minParam || !maxParam) {
        return res.status(400).json({ message: "Min and max parameters are required" });
      }
      const min = parseInt(minParam);
      const max = parseInt(maxParam);
      if (isNaN(min) || isNaN(max)) {
        return res.status(400).json({ message: "Min and max must be valid numbers" });
      }
      const properties2 = await storage.getPropertiesByPriceRange(min, max);
      res.json(properties2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties by price range" });
    }
  });
  app2.get("/api/agents", async (req, res) => {
    try {
      const agents2 = await storage.getAgents();
      res.json(agents2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });
  app2.get("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });
  app2.post("/api/agents", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Admin permission required" });
      }
      const agent = await storage.createAgent(req.body);
      res.status(201).json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to create agent" });
    }
  });
  app2.patch("/api/agents/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Admin permission required" });
      }
      const id = parseInt(req.params.id);
      const agent = await storage.updateAgent(id, req.body);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to update agent" });
    }
  });
  app2.delete("/api/agents/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Admin permission required" });
      }
      const id = parseInt(req.params.id);
      const result = await storage.deleteAgent(id);
      if (result) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Agent not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete agent" });
    }
  });
  app2.post("/api/inquiries", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);
      try {
        const emailTemplate = createInquiryEmailTemplate({
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          message: validatedData.message
        });
        const recipientEmail = "9551304@naver.com";
        console.log(`\uC218\uC2E0\uC790 \uC774\uBA54\uC77C \uC124\uC815: ${recipientEmail}`);
        const emailSent = await sendEmail(
          recipientEmail,
          `[\uC774\uAC00\uC774\uBC84\uBD80\uB3D9\uC0B0 \uC6F9\uC0AC\uC774\uD2B8] ${validatedData.name}\uB2D8\uC758 \uC0C8\uB85C\uC6B4 \uBB38\uC758\uAC00 \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4`,
          emailTemplate
        );
        if (emailSent) {
          console.log(`\uBB38\uC758 ID ${inquiry.id}\uC5D0 \uB300\uD55C \uC54C\uB9BC \uC774\uBA54\uC77C \uC804\uC1A1 \uC644\uB8CC`);
        } else {
          console.error(`\uBB38\uC758 ID ${inquiry.id}\uC5D0 \uB300\uD55C \uC54C\uB9BC \uC774\uBA54\uC77C \uC804\uC1A1 \uC2E4\uD328`);
        }
      } catch (emailError) {
        console.error("\uBB38\uC758 \uC54C\uB9BC \uC774\uBA54\uC77C \uBC1C\uC1A1 \uC911 \uC624\uB958 \uBC1C\uC0DD:", emailError);
      }
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });
  app2.get("/api/properties/:propertyId/inquiries", async (req, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "\uD574\uB2F9 \uB9E4\uBB3C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      let user = null;
      let isAdmin = false;
      if (req.isAuthenticated()) {
        user = req.user;
        isAdmin = user.role === "admin";
      }
      const inquiries2 = await storage.getPropertyInquiries(propertyId);
      const filteredInquiries = inquiries2.map((inquiry) => {
        if (isAdmin) return inquiry;
        if (user && inquiry.userId === user.id) return inquiry;
        if (user && inquiry.isReply && inquiry.parentId) {
          const parentInquiry = inquiries2.find((i) => i.id === inquiry.parentId);
          if (user && parentInquiry?.userId === user.id) return inquiry;
          return {
            ...inquiry,
            content: "\uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uB2F5\uBCC0\uC740 \uBB38\uC758 \uC791\uC131\uC790\uC640 \uAD00\uB9AC\uC790\uB9CC \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
            // 내용 숨김
          };
        }
        return {
          ...inquiry,
          content: "\uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uBB38\uC758\uAE00\uC740 \uC791\uC131\uC790\uC640 \uAD00\uB9AC\uC790\uB9CC \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
          // 내용 숨김
        };
      });
      res.json(filteredInquiries);
    } catch (error) {
      console.error("Error getting property inquiries:", error);
      res.status(500).json({ message: "\uBB38\uC758\uAE00 \uBAA9\uB85D\uC744 \uAC00\uC838\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/properties/:propertyId/inquiries", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const propertyId = parseInt(req.params.propertyId);
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "\uD574\uB2F9 \uB9E4\uBB3C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (req.body.isReply) {
        const isAdmin = user.role === "admin";
        if (!isAdmin) {
          return res.status(403).json({ message: "\uB2F5\uBCC0\uC740 \uAD00\uB9AC\uC790\uB9CC \uC791\uC131\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
        }
        const parentId = req.body.parentId;
        if (!parentId) {
          return res.status(400).json({ message: "\uB2F5\uBCC0\uC5D0\uB294 \uBD80\uBAA8 \uBB38\uC758\uAE00 ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." });
        }
        const parentInquiry = await storage.getPropertyInquiry(parentId);
        if (!parentInquiry) {
          return res.status(404).json({ message: "\uC6D0\uBCF8 \uBB38\uC758\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
        }
        if (parentInquiry.isReply) {
          return res.status(400).json({ message: "\uB2F5\uBCC0\uC5D0\uB294 \uCD94\uAC00 \uB2F5\uBCC0\uC744 \uB2EC \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
        }
      }
      const inquiryData = {
        ...req.body,
        propertyId,
        userId: user.id
      };
      const validatedData = insertPropertyInquirySchema.parse(inquiryData);
      const inquiry = await storage.createPropertyInquiry(validatedData);
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "\uC798\uBABB\uB41C \uBB38\uC758\uAE00 \uB370\uC774\uD130\uC785\uB2C8\uB2E4.", errors: error.errors });
      }
      console.error("Error creating property inquiry:", error);
      res.status(500).json({ message: "\uBB38\uC758\uAE00 \uC791\uC131 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.delete("/api/properties/:propertyId/inquiries/:inquiryId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const inquiryId = parseInt(req.params.inquiryId);
      const inquiry = await storage.getPropertyInquiry(inquiryId);
      if (!inquiry) {
        return res.status(404).json({ message: "\uD574\uB2F9 \uBB38\uC758\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      const user = req.user;
      const isAdmin = user.role === "admin";
      const isAuthor = inquiry.userId === user.id;
      if (!isAdmin && !isAuthor) {
        return res.status(403).json({ message: "\uD574\uB2F9 \uBB38\uC758\uAE00\uC744 \uC0AD\uC81C\uD560 \uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      const success = await storage.deletePropertyInquiry(inquiryId);
      if (success) {
        res.status(200).json({ message: "\uBB38\uC758\uAE00\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
      } else {
        res.status(500).json({ message: "\uBB38\uC758\uAE00 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
      }
    } catch (error) {
      console.error("Error deleting property inquiry:", error);
      res.status(500).json({ message: "\uBB38\uC758\uAE00 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.get("/api/admin/inquiries/unread", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const unreadInquiries = await storage.getUnreadInquiries();
      res.json(unreadInquiries);
    } catch (error) {
      console.error("Error getting unread inquiries:", error);
      res.status(500).json({ message: "\uBBF8\uC77D\uC740 \uBB38\uC758\uAE00\uC744 \uAC00\uC838\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.get("/api/admin/inquiries/unread/count", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const count = await storage.getUnreadInquiryCount();
      res.json({ count });
    } catch (error) {
      console.error("Error getting unread inquiry count:", error);
      res.status(500).json({ message: "\uBBF8\uC77D\uC740 \uBB38\uC758\uAE00 \uC218\uB97C \uAC00\uC838\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.put("/api/admin/inquiries/:inquiryId/read", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const inquiryId = parseInt(req.params.inquiryId);
      const success = await storage.markInquiryAsRead(inquiryId);
      if (success) {
        res.json({ message: "\uBB38\uC758\uAE00\uC744 \uC77D\uC74C \uCC98\uB9AC\uD588\uC2B5\uB2C8\uB2E4." });
      } else {
        res.status(500).json({ message: "\uC77D\uC74C \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
      }
    } catch (error) {
      console.error("Error marking inquiry as read:", error);
      res.status(500).json({ message: "\uC77D\uC74C \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.put("/api/admin/inquiries/read-all", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const success = await storage.markAllInquiriesAsRead();
      if (success) {
        res.json({ message: "\uBAA8\uB4E0 \uBB38\uC758\uAE00\uC744 \uC77D\uC74C \uCC98\uB9AC\uD588\uC2B5\uB2C8\uB2E4." });
      } else {
        res.status(500).json({ message: "\uC77D\uC74C \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
      }
    } catch (error) {
      console.error("Error marking all inquiries as read:", error);
      res.status(500).json({ message: "\uC77D\uC74C \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.get("/api/search", async (req, res) => {
    try {
      const { district, type, minPrice, maxPrice, keyword, skipCache } = req.query;
      console.log("\uAC80\uC0C9 \uD30C\uB77C\uBBF8\uD130:", { district, type, minPrice, maxPrice, keyword, skipCache });
      let properties2 = skipCache === "true" ? await storage.getProperties() : await getCachedProperties();
      if (keyword && typeof keyword === "string" && keyword.trim() !== "") {
        const searchKeyword = keyword.toLowerCase().trim();
        console.log(`\uD0A4\uC6CC\uB4DC \uAC80\uC0C9: "${searchKeyword}"`);
        properties2 = properties2.filter((p) => {
          const title = (p.title || "").toLowerCase();
          const description = (p.description || "").toLowerCase();
          const address = (p.address || "").toLowerCase();
          const district2 = (p.district || "").toLowerCase();
          return title.includes(searchKeyword) || description.includes(searchKeyword) || address.includes(searchKeyword) || district2.includes(searchKeyword);
        });
        console.log(`\uD0A4\uC6CC\uB4DC \uAC80\uC0C9 \uACB0\uACFC: ${properties2.length}\uAC1C \uB9E4\uBB3C`);
      }
      if (district && district !== "all") {
        console.log(`\uC9C0\uC5ED \uD544\uD130\uB9C1: ${district}`);
        properties2 = properties2.filter((p) => {
          const propertyDistrict = (p.district || "").toLowerCase();
          const searchDistrict = district.toLowerCase();
          console.log(`\uB9E4\uBB3C ID ${p.id}\uC758 \uC9C0\uC5ED: "${propertyDistrict}", \uAC80\uC0C9 \uC9C0\uC5ED: "${searchDistrict}"`);
          let isMatch = false;
          if (propertyDistrict === searchDistrict) {
            isMatch = true;
          } else if (searchDistrict === "\uAE30\uD0C0\uC9C0\uC5ED") {
            isMatch = !propertyDistrict.includes("\uAC15\uD654") || propertyDistrict === "";
          } else if (searchDistrict === "all") {
            isMatch = true;
          }
          if (isMatch) {
            console.log(`\u2713 \uB9E4\uCE6D \uB9E4\uBB3C \uBC1C\uACAC: ${p.id}, ${p.title}, ${p.district}`);
          }
          return isMatch;
        });
      }
      if (type && type !== "all") {
        properties2 = properties2.filter((p) => {
          const propertyType = (p.type || "").toLowerCase();
          const searchType = type.toLowerCase();
          return propertyType.includes(searchType);
        });
      }
      if (minPrice && maxPrice) {
        const min = parseInt(minPrice);
        const max = parseInt(maxPrice);
        if (!isNaN(min) && !isNaN(max)) {
          properties2 = properties2.filter((p) => {
            const price = p.price !== void 0 ? Number(p.price) : 0;
            return price >= min && price <= max;
          });
        }
      }
      console.log(`\uAC80\uC0C9 \uACB0\uACFC: ${properties2.length}\uAC1C \uB9E4\uBB3C`);
      res.json(properties2);
    } catch (error) {
      console.error("\uB9E4\uBB3C \uAC80\uC0C9 \uC624\uB958:", error);
      res.status(500).json({ message: "\uB9E4\uBB3C \uAC80\uC0C9 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/properties", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      console.log("\uBD80\uB3D9\uC0B0 \uB4F1\uB85D \uC694\uCCAD \uB370\uC774\uD130:", JSON.stringify(req.body, null, 2));
      try {
        const stripCommas = (value) => {
          if (value === "" || value === null || value === void 0) return null;
          return String(value).replace(/,/g, "");
        };
        const processedData = {
          ...req.body,
          bedrooms: req.body.bedrooms !== void 0 ? req.body.bedrooms : 0,
          bathrooms: req.body.bathrooms !== void 0 ? req.body.bathrooms : 0,
          // 이미지 URL 필드 처리
          imageUrls: Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [],
          // dealType 처리 - 배열로 변환
          dealType: Array.isArray(req.body.dealType) ? req.body.dealType : req.body.dealType ? [req.body.dealType] : ["\uB9E4\uB9E4"],
          // 숫자 필드들 - 쉼표 제거 후 처리
          price: stripCommas(req.body.price) || "0",
          size: stripCommas(req.body.size) || "0",
          // agentId 처리 - 필수 필드이므로 기본값 설정 (database에서는 agent_id로 저장됨)
          agentId: (() => {
            const raw = Number(req.body.agentId || req.body.agent_id);
            return Number.isFinite(raw) && raw > 0 ? raw : 4;
          })(),
          supplyArea: stripCommas(req.body.supplyArea),
          privateArea: stripCommas(req.body.privateArea),
          floor: req.body.floor === "" ? null : req.body.floor ? parseInt(req.body.floor) || null : null,
          totalFloors: req.body.totalFloors === "" ? null : req.body.totalFloors ? parseInt(req.body.totalFloors) || null : null,
          deposit: stripCommas(req.body.deposit),
          depositAmount: stripCommas(req.body.depositAmount),
          monthlyRent: stripCommas(req.body.monthlyRent),
          maintenanceFee: stripCommas(req.body.maintenanceFee)
        };
        console.log("\uCC98\uB9AC\uB41C \uB370\uC774\uD130:", JSON.stringify(processedData, null, 2));
        const validatedData = insertPropertySchema.parse(processedData);
        const property = await storage.createProperty(validatedData);
        res.status(201).json(property);
      } catch (e) {
        if (e instanceof z2.ZodError) {
          console.error("\uC720\uD6A8\uC131 \uAC80\uC0AC \uC624\uB958:", JSON.stringify(e.errors, null, 2));
          return res.status(400).json({ message: "Invalid property data", errors: e.errors });
        }
        throw e;
      }
    } catch (error) {
      console.error("\uBD80\uB3D9\uC0B0 \uB4F1\uB85D \uC624\uB958:", error);
      res.status(500).json({ message: "Failed to create property" });
    }
  });
  app2.patch("/api/properties/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      const existingProperty = await storage.getProperty(id);
      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found" });
      }
      const stripCommas = (value) => {
        if (value === "" || value === null || value === void 0) return null;
        return String(value).replace(/,/g, "");
      };
      const processedData = {
        ...req.body,
        bedrooms: req.body.bedrooms !== void 0 ? req.body.bedrooms : existingProperty.bedrooms || 0,
        bathrooms: req.body.bathrooms !== void 0 ? req.body.bathrooms : existingProperty.bathrooms || 0,
        // 이미지 URL 필드 처리
        imageUrls: Array.isArray(req.body.imageUrls) ? req.body.imageUrls : req.body.imageUrls ? [req.body.imageUrls] : existingProperty.imageUrls || [],
        // dealType 처리 - 배열로 변환
        dealType: Array.isArray(req.body.dealType) ? req.body.dealType : req.body.dealType ? [req.body.dealType] : existingProperty.dealType || ["\uB9E4\uB9E4"],
        // 숫자 필드들 - 쉼표 제거 후 처리
        price: stripCommas(req.body.price) || existingProperty.price || "0",
        size: stripCommas(req.body.size) || existingProperty.size || "0",
        // agentId 처리 - 필수 필드이므로 기본값 설정 (database에서는 agent_id로 저장됨)
        agentId: (() => {
          const raw = Number(req.body.agentId || req.body.agent_id || existingProperty.agentId);
          return Number.isFinite(raw) && raw > 0 ? raw : 4;
        })(),
        supplyArea: stripCommas(req.body.supplyArea),
        privateArea: stripCommas(req.body.privateArea),
        floor: req.body.floor === "" ? null : req.body.floor ? parseInt(req.body.floor) || null : null,
        totalFloors: req.body.totalFloors === "" ? null : req.body.totalFloors ? parseInt(req.body.totalFloors) || null : null,
        deposit: stripCommas(req.body.deposit),
        depositAmount: stripCommas(req.body.depositAmount),
        monthlyRent: stripCommas(req.body.monthlyRent),
        maintenanceFee: stripCommas(req.body.maintenanceFee)
      };
      const validatedData = insertPropertySchema.partial().parse(processedData);
      const updatedProperty = await storage.updateProperty(id, validatedData);
      res.json(updatedProperty);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        console.error("\uBD80\uB3D9\uC0B0 \uC218\uC815 \uC720\uD6A8\uC131 \uAC80\uC0AC \uC624\uB958:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      console.error("\uBD80\uB3D9\uC0B0 \uC218\uC815 \uC624\uB958:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });
  app2.delete("/api/properties/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      const exists = await storage.getProperty(id);
      if (!exists) {
        return res.status(404).json({ message: "Property not found" });
      }
      const result = await storage.deleteProperty(id);
      if (result) {
        memoryCache.deleteByPrefix("properties_");
        res.json({ success: true });
      } else {
        res.status(500).json({ message: "Failed to delete property" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete property" });
    }
  });
  app2.get("/api/admin/users", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.user;
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin permission required" });
      }
      const users2 = await storage.getAllUsers();
      const usersWithoutPasswords = users2.map(({ password, ...userData }) => userData);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/favorites", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      const favoriteProperties = await storage.getFavoriteProperties(user.id);
      res.json(favoriteProperties);
    } catch (error) {
      console.error("Error fetching favorite properties:", error);
      res.status(500).json({ message: "\uAD00\uC2EC\uB9E4\uBB3C \uBAA9\uB85D\uC744 \uAC00\uC838\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.get("/api/properties/:propertyId/is-favorite", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.json({ isFavorite: false });
      }
      const propertyId = parseInt(req.params.propertyId);
      const user = req.user;
      const isFavorite = await storage.isFavorite(user.id, propertyId);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Error checking if property is favorite:", error);
      res.status(500).json({ message: "\uAD00\uC2EC\uB9E4\uBB3C \uD655\uC778 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/favorites", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      const propertyId = parseInt(req.body.propertyId);
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB9E4\uBB3C ID\uC785\uB2C8\uB2E4." });
      }
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "\uD574\uB2F9 \uB9E4\uBB3C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      const favoriteData = {
        userId: user.id,
        propertyId
      };
      try {
        const favorite = await storage.addFavorite(favoriteData);
        res.status(201).json({ message: "\uAD00\uC2EC\uB9E4\uBB3C\uB85C \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", favorite });
      } catch (err) {
        if (err instanceof Error && err.message.includes("\uC774\uBBF8 \uAD00\uC2EC \uB9E4\uBB3C\uB85C \uB4F1\uB85D")) {
          return res.status(409).json({ message: "\uC774\uBBF8 \uAD00\uC2EC\uB9E4\uBB3C\uB85C \uB4F1\uB85D\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4." });
        }
        throw err;
      }
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "\uAD00\uC2EC\uB9E4\uBB3C \uB4F1\uB85D \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.delete("/api/favorites/:propertyId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      const propertyId = parseInt(req.params.propertyId);
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB9E4\uBB3C ID\uC785\uB2C8\uB2E4." });
      }
      const success = await storage.removeFavorite(user.id, propertyId);
      if (success) {
        res.json({ message: "\uAD00\uC2EC\uB9E4\uBB3C\uC5D0\uC11C \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
      } else {
        res.status(404).json({ message: "\uD574\uB2F9 \uAD00\uC2EC\uB9E4\uBB3C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "\uAD00\uC2EC\uB9E4\uBB3C \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.get("/api/news", async (req, res) => {
    try {
      const news3 = await storage.getNews();
      res.json(news3);
    } catch (error) {
      res.status(500).json({ message: "\uB274\uC2A4\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.get("/api/test-real-estate", async (req, res) => {
    try {
      await testRealEstateAPI();
      res.json({
        success: true,
        message: "API \uD14C\uC2A4\uD2B8 \uC644\uB8CC, \uC11C\uBC84 \uB85C\uADF8\uB97C \uD655\uC778\uD558\uC138\uC694"
      });
    } catch (error) {
      console.error("API \uD14C\uC2A4\uD2B8 \uC624\uB958:", error);
      res.status(500).json({
        success: false,
        message: "API \uD14C\uC2A4\uD2B8 \uC911 \uC624\uB958 \uBC1C\uC0DD"
      });
    }
  });
  app2.get("/api/real-estate/transactions", async (req, res) => {
    try {
      const regionCode = req.query.regionCode || "28710";
      console.log(`\uC2E4\uAC70\uB798\uAC00 \uB370\uC774\uD130 \uC694\uCCAD: \uC9C0\uC5ED\uCF54\uB4DC=${regionCode}`);
      const transactions = await getRecentTransactions(regionCode);
      res.json({
        success: true,
        count: transactions.length,
        data: transactions
      });
    } catch (error) {
      console.error("\uC2E4\uAC70\uB798\uAC00 \uB370\uC774\uD130 \uC870\uD68C \uC624\uB958:", error);
      res.status(500).json({
        success: false,
        message: "\uC2E4\uAC70\uB798\uAC00 \uB370\uC774\uD130\uB97C \uAC00\uC838\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
      });
    }
  });
  app2.get("/api/youtube/latest", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 5;
      const cacheKey = `youtube_latest_${limit}`;
      const cachedVideos = memoryCache.get(cacheKey);
      if (cachedVideos) {
        return res.json(cachedVideos);
      }
      const handle = "\uAC15\uD654\uB3C4\uBD80\uB3D9\uC0B0\uC774\uC57C\uAE30";
      const channelUrl = `https://www.youtube.com/@${handle}`;
      const videos = await getLatestYouTubeVideos(channelUrl, limit);
      memoryCache.set(cacheKey, videos, 6 * 60 * 60 * 1e3);
      res.json(videos);
    } catch (error) {
      console.error("\uC720\uD29C\uBE0C \uC601\uC0C1 \uAC00\uC838\uC624\uAE30 \uC624\uB958:", error);
      res.status(500).json({
        message: "\uCD5C\uC2E0 \uC720\uD29C\uBE0C \uC601\uC0C1\uC744 \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/youtube/channel/:channelId", async (req, res) => {
    try {
      const { channelId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const refresh = req.query.refresh === "true";
      const cacheKey = `youtube_channel_videos_${channelId}_${limit}`;
      if (refresh) memoryCache.delete(cacheKey);
      const cachedVideos = memoryCache.get(cacheKey);
      if (cachedVideos) return res.json(cachedVideos);
      const videos = await fetchLatestYouTubeVideosWithAPI(channelId, limit);
      memoryCache.set(cacheKey, videos, 6 * 60 * 60 * 1e3);
      res.json(videos);
    } catch (error) {
      console.error("\uC720\uD29C\uBE0C \uCC44\uB110 \uC601\uC0C1 \uAC00\uC838\uC624\uAE30 \uC624\uB958:", error);
      res.status(500).json({
        message: "\uC720\uD29C\uBE0C \uCC44\uB110 \uC601\uC0C1\uC744 \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/youtube/handle/:handle", async (req, res) => {
    try {
      const { handle } = req.params;
      const cacheKey = `youtube_handle_${handle}`;
      const cachedChannelId = memoryCache.get(cacheKey);
      if (cachedChannelId) return res.json({ channelId: cachedChannelId });
      const channelId = await getChannelIdByHandle(handle);
      if (!channelId) return res.status(404).json({ message: "\uCC44\uB110\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" });
      memoryCache.set(cacheKey, channelId, 24 * 60 * 60 * 1e3);
      res.json({ channelId });
    } catch (error) {
      console.error("\uC720\uD29C\uBE0C \uD578\uB4E4 \uC870\uD68C \uC624\uB958:", error);
      res.status(500).json({
        message: "\uCC44\uB110 ID \uC870\uD68C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/youtube/shorts/:channelId", async (req, res) => {
    try {
      const { channelId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const cacheKey = `youtube_shorts_${channelId}_${limit}`;
      const cachedShorts = memoryCache.get(cacheKey);
      if (cachedShorts) return res.json(cachedShorts);
      const shorts = await fetchYouTubeShorts(channelId, limit);
      memoryCache.set(cacheKey, shorts, 6 * 60 * 60 * 1e3);
      res.json(shorts);
    } catch (error) {
      console.error("\uC720\uD29C\uBE0C \uC1FC\uCE20 \uAC00\uC838\uC624\uAE30 \uC624\uB958:", error);
      res.status(500).json({
        message: "\uC720\uD29C\uBE0C \uC1FC\uCE20\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/blog/latest", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 3;
      const blogId = req.query.blogId || "9551304";
      const categories = req.query.categories ? req.query.categories.split(",") : ["35", "36", "37"];
      const refresh = req.query.refresh === "true";
      const cacheKey = `blog_latest_${blogId}_${categories.join("_")}_${limit}`;
      const now = Date.now();
      const cacheTimestamp = memoryCache.getTimestamp(cacheKey);
      const cacheAge = cacheTimestamp ? now - cacheTimestamp : Infinity;
      const shouldRefresh = refresh || !cacheTimestamp || cacheAge > 10 * 60 * 1e3;
      if (shouldRefresh) {
        console.log(`\uBE14\uB85C\uADF8 \uCE90\uC2DC \uCD08\uAE30\uD654 (\uD0A4: ${cacheKey}, \uC0AC\uC720: ${refresh ? "\uAC15\uC81C \uAC31\uC2E0" : "\uC790\uB3D9 \uAC31\uC2E0"}, \uACBD\uACFC\uC2DC\uAC04: ${cacheAge / 1e3}\uCD08)`);
        memoryCache.delete(cacheKey);
      }
      const cachedPosts = memoryCache.get(cacheKey);
      if (cachedPosts) {
        if (Array.isArray(cachedPosts) && cachedPosts.length > 0) {
          console.log(`\uBE14\uB85C\uADF8 \uCE90\uC2DC\uC5D0\uC11C ${cachedPosts.length}\uAC1C \uD3EC\uC2A4\uD2B8 \uBC18\uD658`);
          return res.json(cachedPosts);
        } else {
          console.log("\uBE14\uB85C\uADF8 \uCE90\uC2DC\uAC00 \uBE44\uC5B4\uC788\uAC70\uB098, \uC798\uBABB\uB41C \uD615\uC2DD\uC785\uB2C8\uB2E4. \uC0C8\uB85C \uAC00\uC838\uC635\uB2C8\uB2E4.");
          memoryCache.delete(cacheKey);
        }
      }
      console.log(`\uBE14\uB85C\uADF8 \uB370\uC774\uD130 \uC0C8\uB85C \uC694\uCCAD (\uD0A4: ${cacheKey})`);
      if (refresh) {
        console.log("\uAC15\uC81C \uC0C8\uB85C\uACE0\uCE68 \uC694\uCCAD - \uC804\uC5ED \uBE14\uB85C\uADF8 \uCE90\uC2DC \uCD08\uAE30\uD654");
        try {
          const blogFetcher = (init_blog_fetcher(), __toCommonJS(blog_fetcher_exports));
          if (blogFetcher.blogCache) {
            blogFetcher.blogCache = {};
            console.log("\uBE14\uB85C\uADF8 \uCE90\uC2DC\uAC00 \uC644\uC804\uD788 \uCD08\uAE30\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBAA8\uB4E0 \uB370\uC774\uD130\uB97C \uC0C8\uB85C \uAC00\uC838\uC635\uB2C8\uB2E4.");
          }
        } catch (e) {
          console.error("\uBE14\uB85C\uADF8 \uCE90\uC2DC \uCD08\uAE30\uD654 \uC2E4\uD328:", e);
        }
      }
      let posts2 = await getLatestBlogPosts(blogId, categories, limit);
      if (!posts2 || posts2.length === 0) {
        console.log("\uBE14\uB85C\uADF8 \uB370\uC774\uD130 \uC870\uD68C \uC2E4\uD328, \uCE74\uD14C\uACE0\uB9AC \uBCC0\uACBD \uD6C4 \uC7AC\uC2DC\uB3C4");
        posts2 = await getLatestBlogPosts(blogId, ["0", "11"], limit);
      }
      if (!posts2 || !Array.isArray(posts2) || posts2.length === 0) {
        console.log("\uB124\uC774\uBC84 \uBE14\uB85C\uADF8\uC5D0\uC11C \uD3EC\uC2A4\uD2B8\uB97C \uAC00\uC838\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD569\uB2C8\uB2E4.");
        try {
          posts2 = await getLatestBlogPosts(blogId, ["11", "0"], limit);
        } catch (retryErr) {
          console.error("\uBE14\uB85C\uADF8 \uB370\uC774\uD130 \uB450 \uBC88\uC9F8 \uC2DC\uB3C4 \uC2E4\uD328:", retryErr);
        }
      }
      if (Array.isArray(posts2)) {
        posts2 = posts2.filter(
          (post) => post && typeof post === "object" && post.id && post.title && post.link
        );
        const uniqueTitles = /* @__PURE__ */ new Set();
        posts2 = posts2.filter((post) => {
          if (!post.title || uniqueTitles.has(post.title)) return false;
          uniqueTitles.add(post.title);
          if (post.title.length > 50) {
            post.title = post.title.substring(0, 50) + "...";
          }
          return true;
        });
      }
      if (Array.isArray(posts2) && posts2.length > 0) {
        console.log(`${posts2.length}\uAC1C\uC758 \uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8\uB97C \uCE90\uC2DC\uC5D0 \uC800\uC7A5 (30\uBD84)`);
        memoryCache.set(cacheKey, posts2, 30 * 60 * 1e3);
      } else {
        console.log("\uC720\uD6A8\uD55C \uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
      }
      res.json(posts2);
    } catch (error) {
      console.error("\uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8 \uAC00\uC838\uC624\uAE30 \uC624\uB958:", error);
      res.status(500).json({
        message: "\uCD5C\uC2E0 \uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/news/latest", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 6;
      const cacheKey = `news_latest_${limit}`;
      const cachedNews = memoryCache.get(cacheKey);
      if (cachedNews) {
        return res.json(cachedNews);
      }
      const news3 = await storage.getLatestNews(limit);
      memoryCache.set(cacheKey, news3, 5 * 60 * 1e3);
      res.json(news3);
    } catch (error) {
      res.status(500).json({ message: "\uCD5C\uC2E0 \uB274\uC2A4\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.get("/api/news/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB274\uC2A4 ID\uC785\uB2C8\uB2E4" });
      }
      const newsItem = await storage.getNewsById(id);
      if (!newsItem) {
        return res.status(404).json({ message: "\uB274\uC2A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" });
      }
      res.json(newsItem);
    } catch (error) {
      res.status(500).json({ message: "\uB274\uC2A4\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.get("/api/news/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const news3 = await storage.getNewsByCategory(category);
      res.json(news3);
    } catch (error) {
      res.status(500).json({ message: "\uCE74\uD14C\uACE0\uB9AC\uBCC4 \uB274\uC2A4\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.post("/api/news", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4" });
      }
      const validatedData = insertNewsSchema.parse(req.body);
      const newsItem = await storage.createNews(validatedData);
      res.status(201).json(newsItem);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB274\uC2A4 \uB370\uC774\uD130\uC785\uB2C8\uB2E4", errors: error.errors });
      }
      res.status(500).json({ message: "\uB274\uC2A4 \uC0DD\uC131\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.patch("/api/news/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB274\uC2A4 ID\uC785\uB2C8\uB2E4" });
      }
      const existingNews = await storage.getNewsById(id);
      if (!existingNews) {
        return res.status(404).json({ message: "\uB274\uC2A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" });
      }
      const validatedData = insertNewsSchema.partial().parse(req.body);
      const updatedNews = await storage.updateNews(id, validatedData);
      res.json(updatedNews);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB274\uC2A4 \uB370\uC774\uD130\uC785\uB2C8\uB2E4", errors: error.errors });
      }
      res.status(500).json({ message: "\uB274\uC2A4 \uC218\uC815\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.delete("/api/news/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB274\uC2A4 ID\uC785\uB2C8\uB2E4" });
      }
      const exists = await storage.getNewsById(id);
      if (!exists) {
        return res.status(404).json({ message: "\uB274\uC2A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" });
      }
      const result = await storage.deleteNews(id);
      if (result) {
        res.json({ success: true });
      } else {
        res.status(500).json({ message: "\uB274\uC2A4 \uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4" });
      }
    } catch (error) {
      res.status(500).json({ message: "\uB274\uC2A4 \uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.get("/api/admin/update-news", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4" });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790 \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      let newsItems = [];
      try {
        newsItems = await fetchAndSaveNews();
        console.log("\uB274\uC2A4 \uC5C5\uB370\uC774\uD2B8 \uC131\uACF5:", newsItems.length, "\uAC1C\uC758 \uB274\uC2A4 \uD56D\uBAA9");
      } catch (err) {
        const fetchError = err;
        console.error("\uB274\uC2A4 \uC5C5\uB370\uC774\uD2B8 \uC911 \uC624\uB958:", fetchError);
        return res.status(500).json({ message: "\uB274\uC2A4 \uC5C5\uB370\uC774\uD2B8 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: " + fetchError.message });
      }
      return res.json({
        success: true,
        message: "\uB274\uC2A4\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uC5C5\uB370\uC774\uD2B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        count: newsItems.length
      });
    } catch (error) {
      console.error("\uB274\uC2A4 \uC218\uB3D9 \uC5C5\uB370\uC774\uD2B8 API \uC624\uB958:", error);
      return res.status(500).json({ message: "\uB274\uC2A4 \uC5C5\uB370\uC774\uD2B8 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.put("/api/properties/:id/order", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const propertyId = parseInt(req.params.id);
      const { displayOrder } = req.body;
      if (typeof displayOrder !== "number") {
        return res.status(400).json({ message: "Display order must be a number" });
      }
      const success = await storage.updatePropertyOrder(propertyId, displayOrder);
      if (!success) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json({ message: "Property order updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update property order" });
    }
  });
  app2.patch("/api/properties/:id/visibility", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const propertyId = parseInt(req.params.id);
      const { isVisible } = req.body;
      if (!propertyId || typeof isVisible !== "boolean") {
        return res.status(400).json({ message: "Property ID and visibility state are required" });
      }
      const success = await storage.togglePropertyVisibility(propertyId, isVisible);
      if (!success) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json({ message: "Property visibility updated successfully" });
    } catch (error) {
      console.error("Error updating property visibility:", error);
      res.status(500).json({ message: "Failed to update property visibility" });
    }
  });
  app2.patch("/api/properties/:id/featured", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const propertyId = parseInt(req.params.id);
      const { featured } = req.body;
      if (!propertyId || typeof featured !== "boolean") {
        return res.status(400).json({ message: "Property ID and featured state are required" });
      }
      const success = await storage.togglePropertyFeatured(propertyId, featured);
      if (!success) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json({ message: "Property featured status updated successfully" });
    } catch (error) {
      console.error("Error updating property featured status:", error);
      res.status(500).json({ message: "Failed to update property featured status" });
    }
  });
  app2.post("/api/properties/batch-delete", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "\uC0AD\uC81C\uD560 \uB9E4\uBB3C ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            return await storage.deleteProperty(parseInt(id));
          } catch (err) {
            console.error(`\uB9E4\uBB3C ID ${id} \uC0AD\uC81C \uC911 \uC624\uB958:`, err);
            return false;
          }
        })
      );
      const successCount = results.filter(Boolean).length;
      memoryCache.deleteByPrefix("properties_");
      res.status(200).json({
        message: `\uCD1D ${ids.length}\uAC1C \uC911 ${successCount}\uAC1C\uC758 \uB9E4\uBB3C\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,
        successCount,
        totalCount: ids.length
      });
    } catch (error) {
      console.error("\uB9E4\uBB3C \uC77C\uAD04 \uC0AD\uC81C \uC911 \uC624\uB958:", error);
      res.status(500).json({ message: "\uB9E4\uBB3C \uC77C\uAD04 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/news/batch-delete", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "\uC0AD\uC81C\uD560 \uB274\uC2A4 ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            return await storage.deleteNews(parseInt(id));
          } catch (err) {
            console.error(`\uB274\uC2A4 ID ${id} \uC0AD\uC81C \uC911 \uC624\uB958:`, err);
            return false;
          }
        })
      );
      const successCount = results.filter(Boolean).length;
      memoryCache.deleteByPrefix("news_");
      res.status(200).json({
        message: `\uCD1D ${ids.length}\uAC1C \uC911 ${successCount}\uAC1C\uC758 \uB274\uC2A4\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,
        successCount,
        totalCount: ids.length
      });
    } catch (error) {
      console.error("\uB274\uC2A4 \uC77C\uAD04 \uC0AD\uC81C \uC911 \uC624\uB958:", error);
      res.status(500).json({ message: "\uB274\uC2A4 \uC77C\uAD04 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/users/batch-delete", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "\uC0AD\uC81C\uD560 \uC0AC\uC6A9\uC790 ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const filteredIds = ids.filter((id) => parseInt(id) !== user.id);
      if (filteredIds.length !== ids.length) {
        console.log("\uC0AC\uC6A9\uC790\uAC00 \uC790\uAE30 \uC790\uC2E0\uC744 \uC0AD\uC81C\uD558\uB824\uACE0 \uC2DC\uB3C4\uD588\uC2B5\uB2C8\uB2E4.");
      }
      const results = await Promise.all(
        filteredIds.map(async (id) => {
          try {
            return await storage.deleteUser(parseInt(id));
          } catch (err) {
            console.error(`\uC0AC\uC6A9\uC790 ID ${id} \uC0AD\uC81C \uC911 \uC624\uB958:`, err);
            return false;
          }
        })
      );
      const successCount = results.filter(Boolean).length;
      res.status(200).json({
        message: `\uCD1D ${filteredIds.length}\uAC1C \uC911 ${successCount}\uAC1C\uC758 \uC0AC\uC6A9\uC790 \uACC4\uC815\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,
        successCount,
        totalCount: filteredIds.length,
        skippedSelf: ids.length !== filteredIds.length
      });
    } catch (error) {
      console.error("\uC0AC\uC6A9\uC790 \uC77C\uAD04 \uC0AD\uC81C \uC911 \uC624\uB958:", error);
      res.status(500).json({ message: "\uC0AC\uC6A9\uC790 \uC77C\uAD04 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/admin/batch-delete/:type", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790 \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const { type } = req.params;
      const { ids } = req.body;
      console.log(`\uC77C\uAD04 \uC0AD\uC81C API \uD638\uCD9C: type=${type}, body=`, req.body);
      console.log(`ids \uD0C0\uC785: ${typeof ids}, \uBC30\uC5F4\uC5EC\uBD80: ${Array.isArray(ids)}, \uAC12:`, ids);
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "\uC720\uD6A8\uD55C ID \uBAA9\uB85D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      console.log(`\uC77C\uAD04 \uC0AD\uC81C \uCC98\uB9AC \uC2DC\uC791: ${type}, \uC0AD\uC81C\uD560 ID \uAC1C\uC218: ${ids.length}, IDs:`, ids);
      let successCount = 0;
      switch (type) {
        case "properties":
          for (const id of ids) {
            const result = await storage.deleteProperty(id);
            if (result) successCount++;
          }
          memoryCache.deleteByPrefix("properties_");
          break;
        case "news":
          for (const id of ids) {
            const result = await storage.deleteNews(id);
            if (result) successCount++;
          }
          memoryCache.deleteByPrefix("news_");
          break;
        case "users":
          const filteredIds = ids.filter((id) => id !== user.id);
          if (filteredIds.length !== ids.length) {
            console.log("\uC0AC\uC6A9\uC790\uAC00 \uC790\uAE30 \uC790\uC2E0\uC744 \uC0AD\uC81C\uD558\uB824\uACE0 \uC2DC\uB3C4\uD588\uC2B5\uB2C8\uB2E4.");
          }
          for (const id of filteredIds) {
            const userToDelete = await storage.getUser(id);
            if (userToDelete && userToDelete.role !== "admin") {
              const result = await storage.deleteUser(id);
              if (result) successCount++;
            }
          }
          break;
        default:
          return res.status(400).json({ message: "\uC9C0\uC6D0\uB418\uC9C0 \uC54A\uB294 \uC720\uD615\uC785\uB2C8\uB2E4." });
      }
      res.json({
        success: true,
        message: `${successCount}\uAC1C\uC758 \uD56D\uBAA9\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,
        deletedCount: successCount,
        skippedSelf: type === "users" && ids.includes(user.id)
      });
    } catch (error) {
      console.error("\uC77C\uAD04 \uC0AD\uC81C \uC624\uB958:", error);
      res.status(500).json({ message: "\uC77C\uAD04 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/admin/check-sheet-duplicates", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const { spreadsheetId, ranges, filterDate } = req.body;
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, error: "\uC11C\uBC84\uC5D0 Google API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." });
      }
      if (!spreadsheetId || !filterDate) {
        return res.status(400).json({ success: false, error: "\uC2A4\uD504\uB808\uB4DC\uC2DC\uD2B8 ID\uC640 \uB0A0\uC9DC\uB294 \uD544\uC218\uC785\uB2C8\uB2E4." });
      }
      const sheetRanges = ranges || ["\uD1A0\uC9C0!A2:BA", "\uC8FC\uD0DD!A2:BA", "\uC544\uD30C\uD2B8\uC678!A2:BA", "\uC0C1\uAC00\uC678!A2:BA"];
      let allDuplicates = [];
      for (const range of sheetRanges) {
        try {
          const result = await checkDuplicatesFromSheet(spreadsheetId, apiKey, range, filterDate);
          if (result.success && result.duplicates) {
            const sheetName = range.split("!")[0];
            allDuplicates = [...allDuplicates, ...result.duplicates.map((d) => ({ ...d, sheetName }))];
          }
        } catch (sheetError) {
          log(`\uC2DC\uD2B8 ${range} \uC911\uBCF5 \uD655\uC778 \uC911 \uC624\uB958 (\uBB34\uC2DC\uB428): ${sheetError}`, "warn");
        }
      }
      res.json({ success: true, duplicates: allDuplicates });
    } catch (error) {
      console.error("\uC911\uBCF5 \uD655\uC778 \uC624\uB958:", error);
      res.status(500).json({ success: false, error: "\uC911\uBCF5 \uD655\uC778 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/admin/import-from-sheet", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const { spreadsheetId, ranges, filterDate, skipAddresses } = req.body;
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, error: "\uC11C\uBC84\uC5D0 Google API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." });
      }
      if (!spreadsheetId) {
        return res.status(400).json({ message: "\uC2A4\uD504\uB808\uB4DC\uC2DC\uD2B8 ID\uB294 \uD544\uC218\uC785\uB2C8\uB2E4." });
      }
      if (!filterDate) {
        return res.status(400).json({ success: false, error: "\uB0A0\uC9DC\uB97C \uBC18\uB4DC\uC2DC \uC120\uD0DD\uD574\uC8FC\uC138\uC694." });
      }
      log(`\uB370\uC774\uD130 \uAC00\uC838\uC624\uAE30 \uC2DC\uC791: \uC2A4\uD504\uB808\uB4DC\uC2DC\uD2B8=${spreadsheetId}, \uB0A0\uC9DC\uD544\uD130=${filterDate}, \uAC74\uB108\uB6F8 \uC8FC\uC18C: ${skipAddresses?.length || 0}\uAC1C`, "info");
      log(`\uC804\uB2EC\uBC1B\uC740 ranges \uD30C\uB77C\uBBF8\uD130: ${JSON.stringify(ranges)}`, "info");
      const sheetRanges = ranges || ["\uD1A0\uC9C0!A2:BA", "\uC8FC\uD0DD!A2:BA", "\uC544\uD30C\uD2B8\uC678!A2:BA", "\uC0C1\uAC00\uC678!A2:BA"];
      log(`\uCC98\uB9AC\uD560 \uC2DC\uD2B8 \uBAA9\uB85D: ${JSON.stringify(sheetRanges)}`, "info");
      let totalCount = 0;
      let allImportedIds = [];
      let allErrors = [];
      const addressesToSkip = skipAddresses || [];
      for (const range of sheetRanges) {
        try {
          log(`\uC2DC\uD2B8 \uCC98\uB9AC \uC2DC\uC791: ${range}`, "info");
          const result = await importPropertiesFromSheet(spreadsheetId, apiKey, range, filterDate, addressesToSkip);
          log(`\uC2DC\uD2B8 \uCC98\uB9AC \uC644\uB8CC: ${range}, \uC131\uACF5=${result.success}, \uAC1C\uC218=${result.count || 0}`, "info");
          if (result.success && result.count) {
            totalCount += result.count;
            if (result.importedIds) {
              allImportedIds = [...allImportedIds, ...result.importedIds];
            }
          }
          if (result.error) {
            log(`\uC2DC\uD2B8 \uC624\uB958 \uBC1C\uC0DD: ${range}: ${result.error}`, "warn");
            allErrors.push(`${range}: ${result.error}`);
          }
        } catch (sheetError) {
          const errorMessage = sheetError?.message || String(sheetError);
          log(`\uC2DC\uD2B8 ${range} \uCC98\uB9AC \uC911 \uC608\uC678 \uBC1C\uC0DD: ${errorMessage}`, "error");
          allErrors.push(`${range}: ${errorMessage}`);
        }
      }
      res.json({
        success: true,
        count: totalCount,
        importedIds: allImportedIds,
        error: allErrors.length > 0 ? allErrors.join("; ") : void 0
      });
    } catch (error) {
      console.error("\uC2A4\uD504\uB808\uB4DC\uC2DC\uD2B8 \uB370\uC774\uD130 \uAC00\uC838\uC624\uAE30 \uC624\uB958:", error);
      res.status(500).json({ success: false, error: "\uB370\uC774\uD130 \uAC00\uC838\uC624\uAE30 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.get("/api/subscription/me", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
    const user = req.user;
    try {
      const history = sqlite.prepare("SELECT * FROM realtor_subscriptions WHERE userId = ? ORDER BY createdAt DESC").all(user.id);
      res.json({
        tier: user.subscriptionTier || "free",
        expiresAt: user.subscriptionExpiresAt,
        history
      });
    } catch (e) {
      res.status(500).json({ message: "\uAD6C\uB3C5 \uC815\uBCF4 \uC870\uD68C \uC2E4\uD328" });
    }
  });
  app2.post("/api/subscription/subscribe", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
    const user = req.user;
    const { planType, imp_uid, merchant_uid } = req.body;
    if (!planType || !imp_uid) {
      return res.status(400).json({ message: "\uD544\uC218 \uACB0\uC81C \uC815\uBCF4\uAC00 \uB204\uB77D\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    }
    try {
      const { verifyPayment: verifyPayment2 } = await Promise.resolve().then(() => (init_portone(), portone_exports));
      const paymentData = await verifyPayment2(imp_uid);
      const expectedAmount = planType === "monthly" ? 5e3 : 5e4;
      if (paymentData.amount < expectedAmount) {
        return res.status(400).json({ message: "\uACB0\uC81C \uAE08\uC561\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." });
      }
      const now = /* @__PURE__ */ new Date();
      const endDate = new Date(now);
      if (planType === "monthly") endDate.setMonth(endDate.getMonth() + 1);
      else endDate.setFullYear(endDate.getFullYear() + 1);
      sqlite.prepare(`INSERT INTO realtor_subscriptions (userId, planType, amount, impUid, merchantUid, status, startDate, endDate, createdAt)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`).run(
        user.id,
        planType,
        paymentData.amount,
        imp_uid,
        merchant_uid || "",
        now.toISOString(),
        endDate.toISOString(),
        now.toISOString()
      );
      sqlite.prepare("UPDATE users SET subscriptionTier = ?, subscriptionExpiresAt = ? WHERE id = ?").run(
        planType,
        endDate.toISOString(),
        user.id
      );
      res.json({ message: "\uAD6C\uB3C5\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", tier: planType, expiresAt: endDate.toISOString() });
    } catch (e) {
      console.error("\uAD6C\uB3C5 \uACB0\uC81C \uC624\uB958:", e);
      res.status(500).json({ message: e.message || "\uACB0\uC81C \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/subscription/cancel", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
    const user = req.user;
    try {
      sqlite.prepare("UPDATE users SET subscriptionTier = 'free', subscriptionExpiresAt = NULL WHERE id = ?").run(user.id);
      sqlite.prepare("UPDATE realtor_subscriptions SET status = 'cancelled' WHERE userId = ? AND status = 'active'").run(user.id);
      res.json({ message: "\uAD6C\uB3C5\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch (e) {
      res.status(500).json({ message: "\uAD6C\uB3C5 \uCDE8\uC18C \uC2E4\uD328" });
    }
  });
  app2.get("/api/admin/realtors/pending", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
    const user = req.user;
    if (user.role !== "admin") return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
    try {
      const pending = sqlite.prepare("SELECT id, username, nickname, email, phone, businessName, businessLicenseNo, businessAddress, isVerified, role, createdAt FROM users WHERE role = 'realtor' AND (isVerified = 0 OR isVerified IS NULL)").all();
      res.json(pending);
    } catch (e) {
      res.status(500).json({ message: "\uBAA9\uB85D \uC870\uD68C \uC2E4\uD328" });
    }
  });
  app2.post("/api/admin/realtors/:id/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
    const user = req.user;
    if (user.role !== "admin") return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
    const id = parseInt(req.params.id);
    const { status, licenseNo } = req.body;
    try {
      if (status === "approved") {
        sqlite.prepare("UPDATE users SET isVerified = 1, businessLicenseNo = COALESCE(?, businessLicenseNo) WHERE id = ?").run(licenseNo || null, id);
        res.json({ message: "\uC911\uAC1C\uC0AC\uAC00 \uC2B9\uC778\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
      } else {
        sqlite.prepare("UPDATE users SET role = 'user', isVerified = 0 WHERE id = ?").run(id);
        res.json({ message: "\uC911\uAC1C\uC0AC \uC2E0\uCCAD\uC774 \uAC70\uBD80\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
      }
    } catch (e) {
      res.status(500).json({ message: "\uCC98\uB9AC \uC2E4\uD328" });
    }
  });
  app2.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
    const user = req.user;
    if (user.role !== "admin") return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
    try {
      const users2 = sqlite.prepare("SELECT id, username, nickname, email, phone, role, businessName, businessLicenseNo, isVerified, subscriptionTier, createdAt FROM users ORDER BY id DESC").all();
      res.json(users2);
    } catch (e) {
      res.status(500).json({ message: "\uD68C\uC6D0 \uBAA9\uB85D \uC870\uD68C \uC2E4\uD328" });
    }
  });
  app2.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const subscription = await storage.createNewsletterSubscription({
        email,
        name: name || null,
        isActive: true
      });
      res.status(201).json({
        message: "Successfully subscribed to newsletter",
        subscription
      });
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      res.status(500).json({ message: "\uC11C\uBC84 \uC624\uB958\uB85C \uAD6C\uB3C5 \uC2E0\uCCAD\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.get("/api/admin/newsletter/subscriptions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      const user = req.user;
      if (user.role !== "admin") return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      const subscriptions = await storage.getNewsletterSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error("Fetch newsletter subscriptions error:", error);
      res.status(500).json({ message: "\uAD6C\uB3C5\uC790 \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.delete("/api/admin/newsletter/subscriptions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      const user = req.user;
      if (user.role !== "admin") return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      const id = parseInt(req.params.id);
      const success = await storage.deleteNewsletterSubscription(id);
      if (success) {
        res.json({ message: "\uAD6C\uB3C5 \uC815\uBCF4\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
      } else {
        res.status(404).json({ message: "\uC0AD\uC81C\uD560 \uAD6C\uB3C5 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
    } catch (error) {
      console.error("Delete newsletter subscription error:", error);
      res.status(500).json({ message: "\uAD6C\uB3C5 \uC815\uBCF4 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.get("/api/admin/crawled-properties", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      const user = req.user;
      if (user.role !== "admin") return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      const properties2 = await storage.getCrawledProperties();
      res.json(properties2);
    } catch (error) {
      console.error("Fetch crawled properties error:", error);
      res.status(500).json({ message: "\uC218\uC9D1\uB41C \uB9E4\uBB3C \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.delete("/api/admin/crawled-properties", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      const user = req.user;
      if (user.role !== "admin") return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      await storage.clearCrawledProperties();
      res.json({ message: "\uC218\uC9D1\uB41C \uB9E4\uBB3C \uBAA9\uB85D\uC774 \uCD08\uAE30\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch (error) {
      console.error("Clear crawled properties error:", error);
      res.status(500).json({ message: "\uC218\uC9D1\uB41C \uB9E4\uBB3C \uBAA9\uB85D \uCD08\uAE30\uD654 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/admin/crawler/run", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      const user = req.user;
      if (user.role !== "admin") return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      const { grid } = req.body;
      if (grid) {
        naverCrawler.fetchAndSaveGrid().catch((err) => console.error("Crawler grid run error:", err));
      } else {
        naverCrawler.fetchAndSave().catch((err) => console.error("Crawler run error:", err));
      }
      res.json({ message: "\uB9E4\uBB3C \uC218\uC9D1\uC774 \uC2DC\uC791\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uC0C8\uB85C\uACE0\uCE68 \uD574\uC8FC\uC138\uC694." });
    } catch (error) {
      console.error("Run crawler error:", error);
      res.status(500).json({ message: "\uB9E4\uBB3C \uC218\uC9D1 \uC2DC\uC791 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  setupNewsScheduler();
  const httpServer = createServer(app2);
  return httpServer;
}

// server/static.ts
import express2 from "express";
import fs2 from "fs";
import path3 from "path";
function log2(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use("/uploads", express3.static(path4.join(process.cwd(), "public/uploads")));
app.use(express3.json({ limit: "10mb" }));
app.use(express3.urlencoded({ limit: "10mb", extended: true }));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log2(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  serveStatic(app);
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0"
  }, () => {
    log2(`serving on port ${port}`);
    setupNewsScheduler();
  });
})();
