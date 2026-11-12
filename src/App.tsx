import { Navigate, Route, Routes } from "react-router-dom";
import Toasts from "./components/Toasts";
import CanvasPage from "./pages/CanvasPage";
import ComparePage from "./pages/ComparePage";
import DesignSystemPage from "./pages/DesignSystemPage";
import FlowPage from "./pages/FlowPage";
import InboxPage from "./pages/InboxPage";
import PolicyPage from "./pages/PolicyPage";
import ProposalPage from "./pages/ProposalPage";
import ScreensPage from "./pages/ScreensPage";
import UserFlowPage from "./pages/UserFlowPage";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<InboxPage />} />
        <Route path="/screens" element={<ScreensPage />} />
        <Route path="/design/system" element={<DesignSystemPage />} />
        <Route path="/design/policy" element={<PolicyPage />} />
        <Route path="/design/flow" element={<UserFlowPage />} />
        <Route path="/p/:id" element={<ProposalPage />} />
        <Route path="/p/:id/canvas" element={<CanvasPage />} />
        <Route path="/p/:id/flow" element={<FlowPage />} />
        <Route path="/p/:id/compare/:screen" element={<ComparePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toasts />
    </>
  );
}
