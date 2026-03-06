import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Home works with ErrorBoundary</div>} />
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
