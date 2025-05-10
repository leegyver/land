  // Property Inquiry Board API
  app.get("/api/properties/:propertyId/inquiries", async (req, res) => {
    try {
      // 인증 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }
      
      const propertyId = parseInt(req.params.propertyId);
      const property = await storage.getProperty(propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "해당 매물을 찾을 수 없습니다." });
      }
      
      // 접근 권한 확인 (관리자 또는 문의글을 작성한 사용자)
      const user = req.user;
      const isAdmin = user.role === "admin";
      
      // 해당 매물에 대한 문의글 목록 가져오기
      const inquiries = await storage.getPropertyInquiries(propertyId);
      
      // 사용자가 작성한 문의글만 필터링 (관리자는 모든 문의글 볼 수 있음)
      const filteredInquiries = isAdmin 
        ? inquiries 
        : inquiries.filter(inquiry => inquiry.userId === user.id);
        
      res.json(filteredInquiries);
    } catch (error) {
      console.error("Error getting property inquiries:", error);
      res.status(500).json({ message: "문의글 목록을 가져오는 중 오류가 발생했습니다." });
    }
  });