import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ThemeProvider } from './theme/ThemeContext';
import { AiAssistantProvider } from './features/assistant/AiAssistantContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CalendarPage } from './pages/CalendarPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectsInvestmentPage } from './pages/ProjectsInvestmentPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ProjectsCurrentPage } from './pages/ProjectsCurrentPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductsListPage } from './pages/ProductsListPage';
import { FinancePage } from './pages/FinancePage';
import { FinanceExpensePage } from './pages/FinanceExpensePage';
import { FinanceIncomePage } from './pages/FinanceIncomePage';
import { FinanceTaxesPage } from './pages/FinanceTaxesPage';
import { FinancePaymentCalendarPage } from './pages/FinancePaymentCalendarPage';
import { HrPage } from './pages/HrPage';
import { HrOutsourcePage } from './pages/HrOutsourcePage';
import { HrStaffPage } from './pages/HrStaffPage';
import { TasksPage } from './pages/TasksPage';
import { SettingsPage } from './pages/SettingsPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/projects" element={<ProjectsPage />}>
                  <Route path="invest/:projectId" element={<ProjectDetailPage category="investment" />} />
                  <Route path="current/:projectId" element={<ProjectDetailPage category="current" />} />
                  <Route path="invest" element={<ProjectsInvestmentPage />} />
                  <Route path="current" element={<ProjectsCurrentPage />} />
                  <Route path="investment" element={<Navigate to="/projects/invest" replace />} />
                  <Route path="development" element={<Navigate to="/projects/current" replace />} />
                </Route>
                <Route path="/products" element={<ProductsPage />}>
                  <Route index element={<ProductsListPage />} />
                  <Route
                    path=":projectId"
                    element={<ProjectDetailPage category="investment" />}
                  />
                </Route>
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/finance" element={<FinancePage />}>
                  <Route path="income" element={<FinanceIncomePage />} />
                  <Route path="expense" element={<FinanceExpensePage />} />
                  <Route path="payment-calendar" element={<FinancePaymentCalendarPage />} />
                  <Route path="taxes" element={<FinanceTaxesPage />} />
                </Route>
                <Route path="/hr" element={<HrPage />}>
                  <Route path="staff" element={<HrStaffPage />} />
                  <Route path="outsource" element={<HrOutsourcePage />} />
                </Route>
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AiAssistantProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AiAssistantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
