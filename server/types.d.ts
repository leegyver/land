// passport-naver와 passport-kakao 모듈의 타입 정의

declare module 'passport-naver' {
  import passport from 'passport';
  
  export interface Profile {
    id: string;
    displayName: string;
    emails?: { value: string }[];
    _json: {
      email?: string;
      mobile?: string;
      nickname?: string;
      profile_image?: string;
      age?: string;
      gender?: string;
      name?: string;
    };
  }
  
  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  }
  
  export class Strategy {
    constructor(
      options: StrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any) => void
      ) => void
    );
    name: string;
    authenticate(req: any, options?: any): void;
  }
}

declare module 'passport-kakao' {
  import passport from 'passport';
  
  export interface Profile {
    id: string;
    username: string;
    displayName: string;
    _json: {
      id: number;
      properties: {
        nickname: string;
        profile_image?: string;
        thumbnail_image?: string;
      };
      kakao_account?: {
        email?: string;
        profile?: {
          nickname: string;
          profile_image_url?: string;
          thumbnail_image_url?: string;
        };
        email_needs_agreement?: boolean;
        has_email?: boolean;
        is_email_valid?: boolean;
        is_email_verified?: boolean;
      };
    };
  }
  
  export interface StrategyOptions {
    clientID: string;
    clientSecret?: string;
    callbackURL: string;
  }
  
  export class Strategy {
    constructor(
      options: StrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any) => void
      ) => void
    );
    name: string;
    authenticate(req: any, options?: any): void;
  }
}