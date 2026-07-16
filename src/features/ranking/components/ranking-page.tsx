"use client";

import { ExternalLink, Plus, Settings, Sliders, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useQueryCollaborators } from "@/features/collaborators/hooks/use-collaborators";
import {
  useSalesGoalRanking,
  useSalesGoalRankingSettings,
} from "@/features/ranking/hooks/use-ranking";
import { buildCollaboratorPhotoMap } from "@/features/ranking/lib/collaborator-name-match";
import type { SalesGoalPeriodType } from "@/features/ranking/lib/sales-goal-xlsx-parser";
import { orpc } from "@/lib/orpc";
import { hasFullAccess } from "@/lib/permissions";
import { SalesGoalAddEntryDialog } from "./sales-goal-add-entry-dialog";
import { SalesGoalImportDialog } from "./sales-goal-import-dialog";
import { SalesGoalRankingBoard } from "./sales-goal-ranking-board";
import { SalesGoalSettingsSheet } from "./sales-goal-settings-sheet";
import { SalesGoalSetupWizard } from "./sales-goal-setup-wizard";

export function RankingPage() {
  const [periodType, setPeriodType] = useState<SalesGoalPeriodType>("MONTHLY");
  const [importOpen, setImportOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addEntryOpen, setAddEntryOpen] = useState(false);

  const query = useSalesGoalRanking(periodType);
  const settingsQuery = useSalesGoalRankingSettings();
  const orgQuery = useQuery(orpc.org.get.queryOptions());
  const publicUrl = orgQuery.data?.organization.slug
    ? `/ranking-publico/${orgQuery.data.organization.slug}`
    : null;
  const currentMemberQuery = useQuery(
    orpc.members.getCurrent.queryOptions({ input: {} }),
  );
  const canEdit = hasFullAccess(currentMemberQuery.data?.role);
  const collaboratorsQuery = useQueryCollaborators(true);
  const collaboratorPhotoByName = useMemo(
    () => buildCollaboratorPhotoMap(collaboratorsQuery.data ?? []),
    [collaboratorsQuery.data],
  );
  const period = query.data;

  return (
    <>
      <SalesGoalRankingBoard
        period={period}
        settings={settingsQuery.data}
        isLoading={query.isLoading}
        periodType={periodType}
        onPeriodTypeChange={setPeriodType}
        onRefresh={() => query.refetch()}
        canEdit={canEdit}
        photoByName={collaboratorPhotoByName}
        toolbarActions={
          publicUrl && (
            <Button
              variant="outline"
              size="icon-sm"
              asChild
              title="Página pública"
            >
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                <span className="sr-only">Página pública</span>
              </a>
            </Button>
          )
        }
        headerActions={
          canEdit && (
            <ButtonGroup>
              <Button
                variant="outline"
                onClick={() => setAddEntryOpen(true)}
                className="gap-2"
              >
                <Plus className="size-4" /> Adicionar meta
              </Button>
              <Button
                variant="outline"
                onClick={() => setImportOpen(true)}
                className="gap-2"
              >
                <Upload className="size-4" /> Importar planilha
              </Button>
              <Button onClick={() => setSettingsOpen(true)} className="gap-2">
                <Settings className="size-4" /> Configurações
              </Button>
            </ButtonGroup>
          )
        }
        emptyStateActions={
          canEdit && (
            <>
              <Button onClick={() => setWizardOpen(true)} className="gap-2">
                <Sliders className="size-4" /> Configurar ranking
              </Button>
              <Button
                variant="outline"
                onClick={() => setImportOpen(true)}
                className="gap-2"
              >
                <Upload className="size-4" /> Importar planilha
              </Button>
            </>
          )
        }
      />

      {canEdit && (
        <>
          <SalesGoalImportDialog
            open={importOpen}
            onOpenChange={setImportOpen}
          />
          <SalesGoalSetupWizard
            open={wizardOpen}
            onOpenChange={setWizardOpen}
            initialPeriodType={periodType}
          />
          <SalesGoalSettingsSheet
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            currentPeriodType={periodType}
            onOpenWizard={() => {
              setSettingsOpen(false);
              setWizardOpen(true);
            }}
          />
          <SalesGoalAddEntryDialog
            open={addEntryOpen}
            onOpenChange={setAddEntryOpen}
            periodType={periodType}
            existingPeriod={period}
            existingBranchNames={(period?.branches ?? []).map(
              (branch) => branch.name,
            )}
          />
        </>
      )}
    </>
  );
}
