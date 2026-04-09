import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ActivityFeedPage } from "@/pages/ActivityFeed";
import { AdminPanelPage } from "@/pages/AdminPanel";
import { DashboardPage } from "@/pages/Dashboard";
import { EscalationsPage } from "@/pages/Escalations";
import { FamilyPage } from "@/pages/FamilyPage";
import { PatientDetailPage } from "@/pages/PatientDetail";

export function App() {
  return (
    <Routes>
      <Route path="/family/:token" element={<FamilyPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/activity" element={<ActivityFeedPage />} />
        <Route path="/escalations" element={<EscalationsPage />} />
        <Route path="/patients/:patientId" element={<PatientDetailPage />} />
        <Route path="/admin" element={<AdminPanelPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
