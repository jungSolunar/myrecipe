import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { SignupPage } from './features/auth/SignupPage';
import { RequireAuth } from './features/auth/RequireAuth';
import { RecipeListPage } from './features/recipes/RecipeListPage';
import { RecipeDetailPage } from './features/recipes/RecipeDetailPage';
import { RecipeFormPage } from './features/recipes/RecipeFormPage';
import { IngredientMasterPage } from './features/ingredients/IngredientMasterPage';
import { InventoryPage } from './features/inventory/InventoryPage';
import { DashboardPage } from './features/dashboard/DashboardPage';

export function App() {
  return (
    <Routes>
      {/* 인증 화면 (앱 헤더 없음) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* 앱 헤더가 있는 화면 */}
      <Route element={<AppLayout />}>
        {/* 비로그인 열람 가능 (US-003) */}
        <Route index element={<RecipeListPage />} />
        <Route path="/recipes/:recipeId" element={<RecipeDetailPage />} />

        {/* 로그인 게이트 (US-003): 홈 대시보드/등록/수정/식재료 마스터 */}
        <Route element={<RequireAuth />}>
          {/* [US-018] 개요 — 홈 대시보드 (로그인 필수 게이트). 기존 index 경로는 불변. */}
          <Route path="/home" element={<DashboardPage />} />
          <Route path="/recipes/new" element={<RecipeFormPage mode="create" />} />
          <Route path="/recipes/:recipeId/edit" element={<RecipeFormPage mode="edit" />} />
          <Route path="/ingredients" element={<IngredientMasterPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
