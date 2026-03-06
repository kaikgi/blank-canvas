import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Button } from "@/components/ui/button";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<div><Button>Test Button</Button></div>} />
    </Routes>
  </BrowserRouter>
);

export default App;
