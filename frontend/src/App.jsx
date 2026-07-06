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
import Profilepage from "./component/profile"
import ContactPage from "./pages/connect";
import Contest from "./pages/context";
import AdminVideo from "./component/adminvideo";
import AdminUpload from "./component/Adminupload";
import ArenaChat from "./component/discord"
import Updateproblem from "./component/updatepeoblem";
import AdminUpdate from "./component/Adminupdate";
import UserProfile from "./component/profile";
import { HLDComponentsDemo } from "./component/hld";
import DuelLobby from "./pages/DuelLobby";
import DuelPage from "./pages/DuelPage";
import DuelLeaderboard from "./pages/DuelLeaderboard";
import SystemDesignLearning from "./systemdesign/SystemDesignLearning";
import ContestDetail from "./component/Contestdetail";
import AdminCreateContest from "./component/creatcontest";
import AdminManageContests from "./component/managecontext";
import ContestProblemEditor from "./component/Contestproblemeditor";
import CheatSheet from "./component/cheatsheet";
import ComplexityVisualizer from "./component/complexity";
function App(){
  const dispatch = useDispatch();
  const {isAuthenticated,user} = useSelector((state)=>state.auth);
  
  // check initial authentication
  useEffect(() => {
    dispatch(checkAuth());
    dispatch(fetchUserState());
    dispatch(fetchProblems());
  }, [dispatch]);
  return(
  <>
    <Routes>
      <Route path="/" element={isAuthenticated ?<Homepage></Homepage>:<Navigate to="/signup" />}></Route>
      <Route path="/login" element={isAuthenticated?<Navigate to="/" />:<Login></Login>}></Route>
      <Route path="/signup" element={isAuthenticated?<Navigate to="/" />:<Signup></Signup>}></Route>
      <Route path="/problem/:problemId" element={<ProblemPage></ProblemPage>}></Route>
      <Route path="/profile" element={<Profilepage></Profilepage>}></Route>
        <Route path="/admin" element={isAuthenticated && user?.role == 'admin' ? <Admin /> : <Navigate to="/" />} />
      <Route path="/admin/create" element={isAuthenticated && user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />} />
      <Route path="/explore/dsa-visualizer" element={<DSAVisualizer></DSAVisualizer>}></Route>
      <Route path="/explore" element={<Explore></Explore>}></Route>
      <Route path="/discuss" element={<ContactPage></ContactPage>}></Route>
      <Route path="/contest" element={<Contest></Contest>}></Route>
      <Route path="/admin/video" element={<AdminVideo></AdminVideo>}></Route>
      <Route path="/admin/upload/:problemId" element={<AdminUpload></AdminUpload>}/>
      <Route path="/arechat" element={<ArenaChat/>}></Route>
      <Route path="/admin/update" element={<Updateproblem></Updateproblem>}></Route>
      <Route path="/admin/update/:problemId" element={<AdminUpdate></AdminUpdate>}/>
      <Route path="/hld" element={<HLDComponentsDemo></HLDComponentsDemo>}></Route>
      <Route path="/duel" element={ <DuelLobby />} />
     <Route path="/duel/:roomCode" element={<DuelPage />} />
    <Route path="/duel/leaderboard" element={<DuelLeaderboard />} />
    <Route path="/explore/system-design" element={<SystemDesignLearning></SystemDesignLearning>}></Route>
    <Route path="/contest/:contestId" element={<ContestDetail></ContestDetail>}></Route>
    <Route path="/admin/contest/create" element={<AdminCreateContest></AdminCreateContest>}></Route>
    <Route path="/admin/contest/manage" element={<AdminManageContests></AdminManageContests>}></Route>
    <Route path="/contest/:contestId/problem/:problemId" element={<ContestProblemEditor></ContestProblemEditor>}></Route>
    <Route path="/explore/cheatsheet" element={<CheatSheet></CheatSheet>}></Route>
    <Route path="/explore/complexity" element={<ComplexityVisualizer></ComplexityVisualizer>}></Route>
    </Routes>
  </>
  )
}

export default App;