import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import {
  lazy,
  Suspense
} from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthenticatedLayout from "./components/navigation/AuthenticatedLayout";
import { ROUTES } from "./routes/paths";

const Home = lazy(()=> import("./pages/Home"));
const Login = lazy(()=> import("./pages/Login"));
const Dashboard = lazy(()=>import("./pages/Dashboard"));
const Register = lazy(() => import("./pages/Register"))
const NotFound = lazy(()=> import("./pages/NotFound"));

const Goals = lazy(()=>import ("./pages/Goals"));
const GoalDetails = lazy(() =>import ("./pages/GoalDetails"));

const DailyRecords = lazy(()=>import("./pages/DailyRecords"));
const DailyRecordDetails = lazy(()=>import ("./pages/DailyRecordDetails"));

const TrackingLinks = lazy(()=> import("./pages/TrackingLinks"));

const Validations  = lazy(()=>import("./pages/Validations"));

const Notifications = lazy(()=>import("./pages/Notifications"));


function App(){
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <p className="p-6">
            Loading page...
          </p>
        }
      > 
        
        <Routes>
          <Route path={ROUTES.home} element={<Home />} />

          <Route path= {ROUTES.login} element= {<Login></Login>}></Route>

          <Route path= {ROUTES.register} element= {<Register></Register>}></Route>

          <Route
            element={
              <ProtectedRoute>
                <AuthenticatedLayout></AuthenticatedLayout>
              </ProtectedRoute>
            }
          >
            <Route path= {ROUTES.dashboard} element={<Dashboard></Dashboard>}></Route>
            <Route path= {ROUTES.goals} element = {<Goals></Goals>}></Route>
            <Route path="/goals/:goalId" element={<GoalDetails></GoalDetails>}></Route>
            <Route path="/goals/:goalId/daily-records" element={<DailyRecords></DailyRecords>}></Route>
            <Route path="/goals/:goalId/daily-records/:dailyRecordId" element={<DailyRecordDetails></DailyRecordDetails>}></Route>
            <Route path= {ROUTES.trackingLinks} element={<TrackingLinks></TrackingLinks>}></Route>
            <Route path= {ROUTES.validations} element= {<Validations></Validations>}></Route>
            <Route path= {ROUTES.notifications} element={<Notifications></Notifications>}></Route>
          </Route>

          <Route path = "*" element={<NotFound></NotFound>}></Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
export default App;