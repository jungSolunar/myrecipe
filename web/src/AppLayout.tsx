import { Outlet } from 'react-router-dom';
import { HeaderContainer } from './features/auth/HeaderContainer';

/** 앱 공통 레이아웃: 스킵 링크 + 헤더 + 라우트 콘텐츠. (로그인/회원가입은 별도 레이아웃) */
export function AppLayout() {
  return (
    <>
      <a className="skip-link" href="#main">
        본문 바로가기
      </a>
      <HeaderContainer />
      <Outlet />
    </>
  );
}
