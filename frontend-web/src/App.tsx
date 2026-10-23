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
import {
    ROUTES,
    ROUTE_PATTERNS
} from "./routes/paths";
import LoadingState
    from "./components/ui/LoadingState";

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

const Tags = lazy(() => import("./pages/Tags"));

function App(){
  return (
    <BrowserRouter>
      <Suspense
          fallback={
              <LoadingState
                  message="Loading page..."
              />
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
            <Route path={ROUTE_PATTERNS.goalDetails} element={<GoalDetails></GoalDetails>}></Route>
            <Route path={ROUTE_PATTERNS.dailyRecords} element={<DailyRecords></DailyRecords>}></Route>
            <Route path={ROUTE_PATTERNS.dailyRecordDetails} element={<DailyRecordDetails></DailyRecordDetails>}></Route>
            <Route path={ROUTE_PATTERNS.tags} element={<Tags />}></Route>
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