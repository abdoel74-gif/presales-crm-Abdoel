/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { Topbar } from './components/Topbar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { NewRequestModal } from './components/NewRequestModal.tsx';
import { WhatsAppDrawer } from './components/WhatsAppDrawer.tsx';
import { ModulePlaceholder } from './components/ModulePlaceholder.tsx';
import { AccessGuard } from './components/AccessGuard.tsx';
import { AccountsView } from './components/AccountsView.tsx';
import { PipelineView } from './components/PipelineView.tsx';
import { PresalesWorkspaceView } from './components/PresalesWorkspaceView.tsx';
import { SizingEngineView } from './components/SizingEngineView.tsx';
import { BoqBuilderView } from './components/BoqBuilderView.tsx';
import { SowAdminView } from './components/SowAdminView.tsx';
import { ProjectHandoverView } from './components/ProjectHandoverView.tsx';
import { AssetInventoryView } from './components/AssetInventoryView.tsx';
import { TechDeskView } from './components/TechDeskView.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { AuditRbacView } from './components/AuditRbacView.tsx';
import { AuthProvider, useAuth } from './lib/AuthContext.tsx';
import { AppPermissionModule } from './lib/auth-rbac.ts';
import {
  SYSTEM_METRICS,
  INITIAL_PRESALES_TASKS,
  INITIAL_OPPORTUNITIES,
  INITIAL_POC_ITEMS,
  INITIAL_WA_NOTIFICATIONS,
} from './data/initialData.ts';
import { PresalesTask, WhatsAppNotification } from './types.ts';

function MainAppContent() {
  const { currentRole, setCurrentRole, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<AppPermissionModule>('dashboard');
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR');
  const [presalesTasks, setPresalesTasks] = useState<PresalesTask[]>(INITIAL_PRESALES_TASKS);
  const [waNotifications, setWaNotifications] = useState<WhatsAppNotification[]>(INITIAL_WA_NOTIFICATIONS);
  
  // Modals & Drawers State
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isWhatsAppDrawerOpen, setIsWhatsAppDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [techDeskPrefillAssetId, setTechDeskPrefillAssetId] = useState<string | undefined>(undefined);

  // Handle new presales submission
  const handleAddNewTask = (newTaskPartial: Partial<PresalesTask>) => {
    const newTask: PresalesTask = {
      id: `ps_${Date.now()}`,
      requestCode: newTaskPartial.requestCode || 'PSR-2026-999',
      opportunityTitle: newTaskPartial.opportunityTitle || 'New Solution Request',
      accountName: newTaskPartial.accountName || 'Enterprise Customer',
      status: newTaskPartial.status || ('In Architecture Analysis' as any),
      priority: newTaskPartial.priority || ('High (48h SLA)' as any),
      techDomain: newTaskPartial.techDomain || ['Cloud Infra'],
      leadArchitect: profile?.name || 'Abdoel',
      sizingWorkloadsCount: newTaskPartial.sizingWorkloadsCount || 10,
      boqMargin: newTaskPartial.boqMargin || 25,
      slaDueHours: newTaskPartial.slaDueHours || 48,
      slaBreached: false,
      pocRequired: newTaskPartial.pocRequired || false,
    };

    setPresalesTasks([newTask, ...presalesTasks]);

    // Dispatch a simulated WhatsApp confirmation alert
    const newAlert: WhatsAppNotification = {
      id: `wa_${Date.now()}`,
      recipientName: `${profile?.name || 'Abdoel'} (Solutions Architect)`,
      recipientPhone: '+62 812-3456-7890',
      type: 'STAGE_UPDATE',
      messagePreview: `📋 [NEW REQUEST] ${newTask.requestCode} created for ${newTask.accountName}. SLA due in ${newTask.slaDueHours}h.`,
      timestamp: 'Just now',
      status: 'Delivered',
    };
    setWaNotifications([newAlert, ...waNotifications]);
  };

  // Handle test WhatsApp dispatch
  const handleSendTestNotification = (phone: string, text: string) => {
    const newAlert: WhatsAppNotification = {
      id: `wa_${Date.now()}`,
      recipientName: 'Test Recipient',
      recipientPhone: phone,
      type: 'APPROVAL_REQUEST',
      messagePreview: text,
      timestamp: 'Just now',
      status: 'Delivered',
    };
    setWaNotifications([newAlert, ...waNotifications]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <AccessGuard module="dashboard" onBackToDashboard={() => setActiveTab('dashboard')}>
            <DashboardView
              metrics={SYSTEM_METRICS}
              presalesTasks={presalesTasks}
              opportunities={INITIAL_OPPORTUNITIES}
              pocItems={INITIAL_POC_ITEMS}
              waNotifications={waNotifications}
              currency={currency}
              onNavigateTab={(tab) => setActiveTab(tab as AppPermissionModule)}
              onOpenNewRequest={() => setIsNewRequestOpen(true)}
            />
          </AccessGuard>
        );

      case 'accounts':
        return (
          <AccessGuard module="accounts" onBackToDashboard={() => setActiveTab('dashboard')}>
            <AccountsView currentRole={currentRole} />
          </AccessGuard>
        );

      case 'opportunities':
        return (
          <AccessGuard module="opportunities" onBackToDashboard={() => setActiveTab('dashboard')}>
            <PipelineView currentRole={currentRole} currency={currency} />
          </AccessGuard>
        );

      case 'presales-queue':
        return (
          <AccessGuard module="presales-queue" onBackToDashboard={() => setActiveTab('dashboard')}>
            <PresalesWorkspaceView
              currentRole={currentRole}
              currency={currency}
              onNavigateToModule={(mod) => setActiveTab(mod as AppPermissionModule)}
              onSendWhatsAppPing={(phone, text) => {
                const newPing: WhatsAppNotification = {
                  id: `wa_${Date.now()}`,
                  recipientName: 'Solutions Architect',
                  recipientPhone: phone,
                  recipientRole: 'Solutions Architect',
                  message: text,
                  messagePreview: text,
                  status: 'Delivered',
                  timestamp: 'Just now',
                  type: 'SLA_ALERT',
                };
                setWaNotifications((prev) => [newPing, ...prev]);
                setIsWhatsAppDrawerOpen(true);
              }}
            />
          </AccessGuard>
        );

      case 'sizing-engine':
        return (
          <AccessGuard module="sizing-engine" onBackToDashboard={() => setActiveTab('dashboard')}>
            <SizingEngineView
              currentRole={currentRole}
              currency={currency}
              onNavigateToBoq={(reqId) => {
                setActiveTab('boq-pricing');
              }}
              onSendWhatsAppAlert={(phone, text) => {
                handleSendTestNotification(phone, text);
              }}
            />
          </AccessGuard>
        );

      case 'boq-pricing':
        return (
          <AccessGuard module="boq-pricing" onBackToDashboard={() => setActiveTab('dashboard')}>
            <BoqBuilderView
              currentRole={currentRole}
              currency={currency}
              onNavigateToSizing={(reqId) => {
                setActiveTab('sizing-engine');
              }}
              onSendWhatsAppAlert={(phone, text) => {
                handleSendTestNotification(phone, text);
              }}
            />
          </AccessGuard>
        );

      case 'sow-builder':
        return (
          <AccessGuard module="sow-builder" onBackToDashboard={() => setActiveTab('dashboard')}>
            <SowAdminView
              currentRole={currentRole}
              currentProfile={profile || undefined}
              currency={currency}
              onNavigateToHandover={(oppId) => {
                setActiveTab('handover');
              }}
              onNavigateToBoq={(reqId) => {
                setActiveTab('boq-pricing');
              }}
              onSendWhatsAppAlert={(phone, text) => {
                handleSendTestNotification(phone, text);
              }}
            />
          </AccessGuard>
        );

      case 'handover':
        return (
          <AccessGuard module="handover" onBackToDashboard={() => setActiveTab('dashboard')}>
            <ProjectHandoverView
              currentRole={currentRole}
              currentProfile={profile || undefined}
              currency={currency}
              onNavigateToSow={(sowId) => {
                setActiveTab('sow-builder');
              }}
              onSendWhatsAppAlert={(phone, text) => {
                handleSendTestNotification(phone, text);
              }}
            />
          </AccessGuard>
        );

      case 'assets-poc':
        return (
          <AccessGuard module="assets-poc" onBackToDashboard={() => setActiveTab('dashboard')}>
            <AssetInventoryView
              currentRole={currentRole}
              currentProfile={profile || undefined}
              currency={currency}
              onNavigateToTechDesk={(assetId) => {
                setTechDeskPrefillAssetId(assetId);
                setActiveTab('tech-desk');
              }}
              onSendWhatsAppAlert={(phone, text) => {
                handleSendTestNotification(phone, text);
              }}
            />
          </AccessGuard>
        );

      case 'tech-desk':
        return (
          <AccessGuard module="tech-desk" onBackToDashboard={() => setActiveTab('dashboard')}>
            <TechDeskView
              currentRole={currentRole}
              currentProfile={profile || undefined}
              initialAssetIdFilter={techDeskPrefillAssetId}
              onNavigateToAsset={(assetId) => {
                setActiveTab('assets-poc');
              }}
              onSendWhatsAppAlert={(phone, text) => {
                handleSendTestNotification(phone, text);
              }}
            />
          </AccessGuard>
        );

      case 'whatsapp-gateway':
        return (
          <AccessGuard module="whatsapp-gateway" onBackToDashboard={() => setActiveTab('dashboard')}>
            <ModulePlaceholder
              title="WhatsApp Gateway API & Webhook Dispatcher"
              category="Integrations & Governance"
              description="HMAC-SHA256 authenticated webhook receiver, automated approval buttons, and real-time stage change alerts."
              stepNumber="Steps 49 - 50"
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          </AccessGuard>
        );

      case 'audit-rbac':
        return (
          <AccessGuard module="audit-rbac" onBackToDashboard={() => setActiveTab('dashboard')}>
            <AuditRbacView
              onBackToDashboard={() => setActiveTab('dashboard')}
              onNavigateToModule={(mod) => setActiveTab(mod as AppPermissionModule)}
            />
          </AccessGuard>
        );

      default:
        return (
          <DashboardView
            metrics={SYSTEM_METRICS}
            presalesTasks={presalesTasks}
            opportunities={INITIAL_OPPORTUNITIES}
            pocItems={INITIAL_POC_ITEMS}
            waNotifications={waNotifications}
            currency={currency}
            onNavigateTab={(tab) => setActiveTab(tab as AppPermissionModule)}
            onOpenNewRequest={() => setIsNewRequestOpen(true)}
          />
        );
    }
  };

  return (
    <div id="app-root" className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900 antialiased">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as AppPermissionModule)}
        currentRole={currentRole}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar
          currentUser={profile || {
            id: 'usr_default',
            name: 'Abdoel',
            email: 'abdoel74@gmail.com',
            role: currentRole,
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            department: 'Principal Solutions Architect',
          }}
          currentRole={currentRole}
          setCurrentRole={setCurrentRole}
          currency={currency}
          setCurrency={setCurrency}
          onOpenNewRequest={() => setIsNewRequestOpen(true)}
          onOpenWhatsAppDrawer={() => setIsWhatsAppDrawerOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Dynamic Main Body */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-300">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Interactive Modals and Drawers */}
      <NewRequestModal
        isOpen={isNewRequestOpen}
        onClose={() => setIsNewRequestOpen(false)}
        onSubmit={handleAddNewTask}
      />

      <WhatsAppDrawer
        isOpen={isWhatsAppDrawerOpen}
        onClose={() => setIsWhatsAppDrawerOpen(false)}
        notifications={waNotifications}
        onSendTestNotification={handleSendTestNotification}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
