import { BrowserRouter, Routes, Route } from "react-router-dom";
import { cn } from "./lib/utils";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<div className={cn("p-4")}>Home with cn() works</div>} />
    </Routes>
  </BrowserRouter>
);

export default App;
