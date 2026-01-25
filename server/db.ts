import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Firebase Admin SDK 초기화
// 환경 변수 GOOGLE_APPLICATION_CREDENTIALS가 설정되어 있거나
// 로컬 환경에서 gcloud auth application-default login을 수행했을 경우 자동으로 자격 증명을 로드합니다.
if (!admin.apps.length) {
  try {
    let credential;

    // 1. JSON 문자열 환경 변수 확인 (클라우드 배포용)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      console.log("Found FIREBASE_SERVICE_ACCOUNT_JSON env var");
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        // 간단한 검증: 필수 필드가 있는지 확인
        if (serviceAccount.project_id && serviceAccount.private_key && serviceAccount.client_email) {
          console.log(`Successfully parsed service account for project: ${serviceAccount.project_id}`);
          credential = admin.credential.cert(serviceAccount);
        } else {
          console.error("FIREBASE_SERVICE_ACCOUNT_JSON is missing required fields (project_id, private_key, client_email)");
        }
      } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", e);
      }
    } else {
      console.log("FIREBASE_SERVICE_ACCOUNT_JSON env var not found");
    }

    // 2. 기본값 (파일 경로 GOOGLE_APPLICATION_CREDENTIALS 또는 로컬 인증)
    if (!credential) {
      console.log("Attempting to use applicationDefault credentials...");
      credential = admin.credential.applicationDefault();
    }

    if (credential) {
      admin.initializeApp({
        credential
      });
      console.log("Firebase Admin Initialized Successfully");
    } else {
      console.error("No valid credentials found for Firebase Admin");
    }
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error);
    console.log("Mocking Firestore/Auth for build process...");
    // 빌드나 테스트 중 에러 방지를 위해 예외 처리. 
    // 실제 런타임에는 적절한 자격 증명이 필수입니다.
  }
}

export const db = getFirestore();
export const auth = getAuth();