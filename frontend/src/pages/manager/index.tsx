import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import Home from './home/Home';
import Issue from './issue/Issue';
import Project from './projects/Project';
import ProjectList from './projects/ProjectList';
import CreateProject from './projects/CreateProject';
import EditProject from './projects/EditProject';
import ProjectDetails from './projects/ProjectDetails';
import Sprint from './sprints/Sprint';
import SprintDetail from './sprints/SprintDetail';
import SettingsLayout from './settings/SettingsLayout';
import OrganizationSettings from './settings/OrganizationSettings';
import ProfileSettings from './settings/ProfileSettings';
import BillingSettings from './settings/BillingSettings';
import SecuritySettings from './settings/SecuritySettings';

const ManagerPage = () => {
  const location = useLocation();
  return (
    <Routes>
      {/* Sprint routes - must be before index to avoid matching issues */}
      <Route path="sprints" element={<Sprint />} />
      <Route path="sprints/:id" element={<SprintDetail />} />
      
      {/* Issue routes */}
      <Route path="issues/*" element={<Issue />} />
      
      {/* Home route */}
      <Route path="home/*" element={<Home />} />
      
      {/* Default manager dashboard (home) */}
      <Route index element={<Home />} />
      
      {/* Project routes */}
      <Route path="projects" element={<Project />}>        
        <Route index element={<ProjectList />} />
        <Route path="create" element={<CreateProject />} />
        <Route path=":id" element={<ProjectDetails />} />
        <Route path=":id/edit" element={<EditProject />} />
        <Route path=":id/overview" element={<ProjectDetails />} />
        <Route path=":id/issues" element={<ProjectDetails />} />
        <Route path=":id/kanban" element={<ProjectDetails />} />
        <Route path=":id/team" element={<ProjectDetails />} />
        <Route path=":id/timeline" element={<ProjectDetails />} />
        <Route path=":id/analytics" element={<ProjectDetails />} />
        <Route path=":id/settings" element={<ProjectDetails />} />
      </Route>
      
      {/* Settings routes */}
      <Route path="settings" element={<SettingsLayout />}>
        <Route index element={<OrganizationSettings />} />
        <Route path="organization" element={<OrganizationSettings />} />
        <Route path="profile" element={<ProfileSettings />} />
        <Route path="billing" element={<BillingSettings />} />
        <Route path="security" element={<SecuritySettings />} />
      </Route>
    </Routes>
  );
};

export default ManagerPage;