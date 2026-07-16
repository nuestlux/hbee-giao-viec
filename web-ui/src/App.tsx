import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import RequireAuth from './components/RequireAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IncomingDocuments from './pages/IncomingDocuments';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import DepartmentWork from './pages/DepartmentWork';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Users from './pages/system/Users';
import Roles from './pages/system/Roles';
import Departments from './pages/system/Departments';
import Catalogs from './pages/system/Catalogs';
import SystemSettings from './pages/system/SystemSettings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="documents" element={<IncomingDocuments />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="department-work" element={<DepartmentWork />} />
          <Route path="reports" element={<Reports />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="system/settings" element={<SystemSettings />} />
          <Route path="system/users" element={<Users />} />
          <Route path="system/roles" element={<Roles />} />
          <Route path="system/departments" element={<Departments />} />
          <Route path="system/catalogs" element={<Catalogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
