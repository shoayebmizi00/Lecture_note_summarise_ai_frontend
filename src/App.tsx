import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Upload } from "./pages/Upload";
import { Workspace } from "./pages/Workspace";
import { Results } from "./pages/Results";
import { Topics } from "./pages/Topics";
import { Quiz } from "./pages/Quiz";
import { Evaluation } from "./pages/Evaluation";
import { History } from "./pages/History";
import { Settings } from "./pages/Settings";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/lectures/:lectureId" element={<Workspace />} />
          <Route path="/lectures/:lectureId/topics" element={<Topics />} />
          <Route path="/lectures/:lectureId/quiz" element={<Quiz />} />
          <Route path="/lectures/:lectureId/evaluation" element={<Evaluation />} />
          <Route path="/summaries/:summaryId" element={<Results />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
