"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvitationsPanel } from "@/features/invitations/components/invitations-panel";
import { MembersPanel } from "@/features/members/components/members-panel";
import { useCurrentMember } from "@/features/members/hooks/use-members";
import { hasFullAccess } from "@/lib/permissions";
import { ModulesPanel } from "./modules-panel";
import { PermissionsPanel } from "./permissions-panel";

export function OrganizationSettingsTabs() {
  const { member } = useCurrentMember();
  const canManage = hasFullAccess(member?.role);

  return (
    <Tabs defaultValue="members">
      <TabsList>
        <TabsTrigger value="members">Membros</TabsTrigger>
        <TabsTrigger value="invitations">Convites</TabsTrigger>
        <TabsTrigger value="permissions">Permissões</TabsTrigger>
        <TabsTrigger value="modules">Módulos</TabsTrigger>
      </TabsList>

      <TabsContent value="members" className="mt-4">
        <MembersPanel
          canManage={canManage}
          currentMemberId={member?.id ?? null}
        />
      </TabsContent>

      <TabsContent value="invitations" className="mt-4">
        <InvitationsPanel canManage={canManage} />
      </TabsContent>

      <TabsContent value="permissions" className="mt-4">
        <PermissionsPanel />
      </TabsContent>

      <TabsContent value="modules" className="mt-4">
        <ModulesPanel />
      </TabsContent>
    </Tabs>
  );
}
