import {Routes, Route ,Navigate} from "react-router";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from "./authSlice";
import { useEffect } from "react";
import ProblemPage from "./pages/editor";
import { fetchUserState } from "./userslice";
import { fetchProblems } from "./problemslice";
import BinarySearchVisualizer from "./pages/visu";
import Admin from "./pages/admin";
import AdminPanel from "./component/creat";
import DSAVisualizer from "./pages/visu";
import Explore from "./pages/expore";
import ProfilePage from "./pages/ProfilePage";
import Community from "./pages/connect";
import CommunityPostDetail from "./pages/Communitypostdetail";
import Contest from "./pages/context";
import AdminVideo from "./component/adminvideo";
import AdminUpload from "./component/Adminupload";
import ArenaChat from "./component/discord"
import Updateproblem from "./component/updatepeoblem";
import AdminUpdate from "./component/Adminupdate";
import UserProfile from "./component/profile";
import DuelLobby from "./pages/DuelLobby";
import DuelPage from "./pages/DuelPage";
import DuelLeaderboard from "./pages/DuelLeaderboard";
import SystemDesignLearning from "./systemdesign/SystemDesignLearning";
import ContestDetail from "./component/Contestdetail";
import AdminCreateContest from "./component/creatcontest";
import AdminManageContests from "./component/managecontext";
import ContestProblemEditor from "./component/Contestproblemeditor";
import CheatSheet from "./component/cheatsheet";
import AdminListPage from "./pages/AdminListPage";
import TimeComplexityVisualizer from "./component/complexity"
import IncomingChatPopup from "./component/IncomingChatPopup"; 
import socket from "./utils/socket";
import ChatRoomPage from "./pages/chatroompage";
// -- college feature --
import ManageColleges from "./component/ManageColleges";
import CollegeAdminDashboard from "./pages/CollegeAdminDashboard";
import RegisterCollege from "./component/Registercollege";
import CollegeRequests from "./pages/CollegeRequests";

// NOTE: no "/discuss" route exists anywhere in this file. If clicking
// "Community" sometimes lands you on a discuss view, that behavior is being
// decided *inside* the Community page component (./pages/connect.jsx) —
// e.g. a default tab, a redirect based on stored state, or an internal
// nested route — not here. Check that file for the actual cause.

function App(){
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // connect socket + mark user online once authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;

    socket.connect();
    socket.on("connect", () => {
      socket.emit("user:online", { userId: user._id, role: user.role });
    });

    return () => {
      socket.off("connect");
      socket.disconnect();
    };
  }, [isAuthenticated, user?._id, user?.role]);

  // check initial authentication (runs once on app load)
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // fetch user state + problems whenever auth status becomes true
  // (this re-runs right after login, so data shows without needing a refresh)
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserState());
      dispatch(fetchProblems());
    }
  }, [dispatch, isAuthenticated]);

  return(
  <>
    {/* Shows an Accept/Decline popup to admins whenever a user requests a chat.
        Mounted here (outside <Routes>) so it works no matter which page the admin is on. */}
   {isAuthenticated && user?.role === "CollageAdmin" && <IncomingChatPopup />}

    <Routes>
      <Route path="/" element={isAuthenticated ?<Homepage></Homepage>:<Navigate to="/signup" />}></Route>
      <Route path="/login" element={isAuthenticated?<Navigate to="/" />:<Login></Login>}></Route>
      <Route path="/signup" element={isAuthenticated?<Navigate to="/" />:<Signup></Signup>}></Route>
      <Route path="/problem/:problemId" element={<ProblemPage></ProblemPage>}></Route>
    <Route path="/profile/:userId" element={<ProfilePage></ProfilePage>}></Route>
        <Route path="/admin" element={isAuthenticated && user?.role == 'Admin' ? <Admin /> : <Navigate to="/" />} />
      <Route path="/admin/create" element={isAuthenticated && user?.role === 'Admin' ? <AdminPanel /> : <Navigate to="/" />} />
      <Route path="/explore/dsa-visualizer" element={<DSAVisualizer></DSAVisualizer>}></Route>
      <Route path="/explore" element={<Explore></Explore>}></Route>
      <Route path="/contest" element={<Contest></Contest>}></Route>
      <Route path="/admin/video" element={<AdminVideo></AdminVideo>}></Route>
      <Route path="/admin/upload/:problemId" element={<AdminUpload></AdminUpload>}/>
      <Route path="/arechat" element={<ArenaChat/>}></Route>
      <Route path="/admin/update" element={<Updateproblem></Updateproblem>}></Route>
      <Route path="/admin/update/:problemId" element={<AdminUpdate></AdminUpdate>}/>
      <Route path="/duel" element={ <DuelLobby />} />
     <Route path="/duel/:roomCode" element={<DuelPage />} />
    <Route path="/duel/leaderboard" element={<DuelLeaderboard />} />
    <Route path="/explore/system-design" element={<SystemDesignLearning></SystemDesignLearning>}></Route>
    <Route path="/contest/:contestId" element={<ContestDetail></ContestDetail>}></Route>
    <Route path="/admin/contest/create" element={<AdminCreateContest></AdminCreateContest>}></Route>
    <Route path="/admin/contest/manage" element={<AdminManageContests></AdminManageContests>}></Route>
    <Route path="/contest/:contestId/problem/:problemId" element={<ContestProblemEditor></ContestProblemEditor>}></Route>
    <Route path="/explore/cheatsheet" element={<CheatSheet></CheatSheet>}></Route>
    <Route path="/explore/complexity" element={<TimeComplexityVisualizer></TimeComplexityVisualizer>}></Route>
    <Route path="/explore/talkadmin" element={<AdminListPage /> } />
    <Route path="/chat/:roomName" element={isAuthenticated ? <ChatRoomPage /> : <Navigate to="/login" />} />
    {/* -- college feature -- */}
    {/* Platform admin: browse every registered college + its admin details */}
    <Route path="/admin/colleges" element={isAuthenticated && user?.role === 'Admin' ? <ManageColleges /> : <Navigate to="/" />} />
    {/* Platform admin: onboard a new college (uses the admin-only POST /collage, not the public /collage/register) */}
    <Route path="/admin/colleges/register" element={isAuthenticated && user?.role === 'Admin' ? <RegisterCollege /> : <Navigate to="/" />} />
    {/* Platform admin: review self-service registration requests from the public Signup page popup, approve/reject them */}
    <Route path="/admin/colleges/requests" element={isAuthenticated && user?.role === 'Admin' ? <CollegeRequests /> : <Navigate to="/" />} />
    {/* Platform admin: drill into one college's dashboard (view-only lens on someone else's college) */}
    <Route path="/admin/colleges/:collegeId" element={isAuthenticated && user?.role === 'Admin' ? <CollegeAdminDashboard /> : <Navigate to="/" />} />
    {/* College admin: their own college's dashboard (collegeId comes from their own user record) */}
    <Route path="/collegeadmin" element={isAuthenticated && user?.role === 'CollageAdmin' ? <CollegeAdminDashboard /> : <Navigate to="/" />} />
    <Route path="/community" element={<Community />} />
<Route path="/community/post/:id" element={<CommunityPostDetail />} />
    </Routes>
  </>
  )
}

export default App;