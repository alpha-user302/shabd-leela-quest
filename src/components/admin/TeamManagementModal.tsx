import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, Plus, Users, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  username: string;
  team_name: string;
  created_at: string;
  submission_count?: number;
  latest_submission?: {
    is_final: boolean;
    submitted_at: string;
    accuracy_percentage?: number;
  };
}

interface TeamManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamManagementModal({ open, onOpenChange }: TeamManagementModalProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState({
    username: '',
    password: '',
    team_name: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchTeams();
    }
  }, [open]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      // Fetch teams with submission data
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;

      // Fetch submission counts and latest submissions
      const teamsWithSubmissions = await Promise.all(
        (teamsData || []).map(async (team) => {
          // Get submission count
          const { count } = await supabase
            .from('team_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id);

          // Get latest submission
          const { data: latestSubmission } = await supabase
            .from('team_submissions')
            .select('is_final, submitted_at')
            .eq('team_id', team.id)
            .order('submitted_at', { ascending: false })
            .limit(1)
            .single();

          // Get accuracy if final submission exists
          let accuracy = undefined;
          if (latestSubmission?.is_final) {
            const { data: reportData } = await supabase
              .rpc('get_team_reports')
              .eq('team_name', team.team_name)
              .single();
            
            if (reportData) {
              accuracy = reportData.accuracy_percentage;
            }
          }

          return {
            ...team,
            submission_count: count || 0,
            latest_submission: latestSubmission ? {
              ...latestSubmission,
              accuracy_percentage: accuracy
            } : undefined
          };
        })
      );

      setTeams(teamsWithSubmissions);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Error",
        description: "Failed to fetch teams data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async () => {
    if (!newTeam.username || !newTeam.password || !newTeam.team_name) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('add_team', {
        team_username: newTeam.username,
        team_password: newTeam.password,
        team_display_name: newTeam.team_name
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Team "${newTeam.team_name}" added successfully.`,
      });

      setNewTeam({ username: '', password: '', team_name: '' });
      setShowAddForm(false);
      fetchTeams();
    } catch (error) {
      console.error('Error adding team:', error);
      toast({
        title: "Error",
        description: "Failed to add team. Username might already exist.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          username: editingTeam.username,
          team_name: editingTeam.team_name
        })
        .eq('id', editingTeam.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team updated successfully.",
      });

      setEditingTeam(null);
      fetchTeams();
    } catch (error) {
      console.error('Error updating team:', error);
      toast({
        title: "Error",
        description: "Failed to update team.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete team "${teamName}"? This will also delete all their submissions.`)) {
      return;
    }

    setLoading(true);
    try {
      // Delete submissions first due to foreign key constraint
      await supabase
        .from('team_submissions')
        .delete()
        .eq('team_id', teamId);

      // Then delete the team
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Team "${teamName}" deleted successfully.`,
      });

      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: "Error",
        description: "Failed to delete team.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAccuracyBadge = (accuracy?: number) => {
    if (accuracy === undefined) return null;
    
    let variant: "default" | "secondary" | "destructive" = "secondary";
    if (accuracy >= 80) variant = "default";
    else if (accuracy >= 50) variant = "secondary";
    else variant = "destructive";

    return (
      <Badge variant={variant}>
        {accuracy}% accurate
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Management
          </DialogTitle>
          <DialogDescription>
            Manage teams, view their progress, and monitor submissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-primary">{teams.length}</CardTitle>
                <CardDescription>Total Teams</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-primary">
                  {teams.filter(t => t.latest_submission?.is_final).length}
                </CardTitle>
                <CardDescription>Final Submissions</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-primary">
                  {teams.reduce((sum, t) => sum + (t.submission_count || 0), 0)}
                </CardTitle>
                <CardDescription>Total Submissions</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Add Team Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Teams List</h3>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Team
            </Button>
          </div>

          {/* Add Team Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="new-username">Username</Label>
                    <Input
                      id="new-username"
                      value={newTeam.username}
                      onChange={(e) => setNewTeam(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="team_username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newTeam.password}
                      onChange={(e) => setNewTeam(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-team-name">Team Name</Label>
                    <Input
                      id="new-team-name"
                      value={newTeam.team_name}
                      onChange={(e) => setNewTeam(prev => ({ ...prev, team_name: e.target.value }))}
                      placeholder="Team Display Name"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTeam} disabled={loading}>
                    Add Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Teams Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        {editingTeam?.id === team.id ? (
                          <Input
                            value={editingTeam.team_name}
                            onChange={(e) => setEditingTeam(prev => prev ? { ...prev, team_name: e.target.value } : null)}
                            className="w-32"
                          />
                        ) : (
                          <div className="font-medium">{team.team_name}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingTeam?.id === team.id ? (
                          <Input
                            value={editingTeam.username}
                            onChange={(e) => setEditingTeam(prev => prev ? { ...prev, username: e.target.value } : null)}
                            className="w-24"
                          />
                        ) : (
                          <code className="text-sm">{team.username}</code>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {team.submission_count} submissions
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {team.latest_submission?.is_final ? (
                          <Badge variant="default">Final Submitted</Badge>
                        ) : team.submission_count ? (
                          <Badge variant="secondary">Draft Saved</Badge>
                        ) : (
                          <Badge variant="outline">No Submission</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {getAccuracyBadge(team.latest_submission?.accuracy_percentage)}
                      </TableCell>
                      <TableCell>
                        {team.latest_submission ? (
                          <div className="text-sm text-muted-foreground">
                            {formatDate(team.latest_submission.submitted_at)}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {formatDate(team.created_at)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {editingTeam?.id === team.id ? (
                            <>
                              <Button size="sm" onClick={handleUpdateTeam} disabled={loading}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingTeam(null)}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingTeam(team)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteTeam(team.id, team.team_name)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {teams.length === 0 && !loading && (
            <Alert>
              <Target className="w-4 h-4" />
              <AlertDescription>
                No teams found. Add your first team to get started!
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}