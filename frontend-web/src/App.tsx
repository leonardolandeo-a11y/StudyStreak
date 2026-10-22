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
import Goals from "./pages/Goals";
import GoalDetails from "./pages/GoalDetails";
import DailyRecords from "./pages/DailyRecords";
import DailyRecordDetails from "./pages/DailyRecordDetails";
import TrackingLinks from "./pages/TrackingLinks";
import Validations from "./pages/Validations";

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
        }></Route>

        <Route path= "/goals" element= {
          <ProtectedRoute>
              <Goals></Goals>
          </ProtectedRoute>
        }></Route>

        <Route path = "/goals/:goalId"element={
          <ProtectedRoute>
            <GoalDetails></GoalDetails>
          </ProtectedRoute>
        }></Route>

        <Route path="/goals/:goalId/daily-records" element={
          <ProtectedRoute>
            <DailyRecords></DailyRecords>
          </ProtectedRoute>
        }></Route>
        
        <Route path= "/goals/:goalId/daily-records/:dailyRecordId" element={
          <ProtectedRoute>
            <DailyRecordDetails></DailyRecordDetails>
          </ProtectedRoute>
        }></Route>
        
        <Route path="/tracking-links" element={
          <ProtectedRoute>
            <TrackingLinks></TrackingLinks>
          </ProtectedRoute>
        }></Route>
        
        <Route path= "/validations" element ={
          <ProtectedRoute>
            <Validations></Validations>
          </ProtectedRoute>
        }></Route>
        
        <Route path = "*" element={<NotFound></NotFound>}></Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;