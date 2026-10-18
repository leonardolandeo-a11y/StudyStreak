import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";


function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path= "/login" element= {<Login></Login>}></Route>

        <Route path="/register" element= {<Register></Register>}></Route>

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard></Dashboard>
            </ProtectedRoute>
          }
        ></Route>

        <Route path = "*" element={<NotFound></NotFound>}></Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;