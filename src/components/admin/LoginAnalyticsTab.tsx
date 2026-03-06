import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MapPin, Monitor, Shield, Clock, Users, ChevronDown, ChevronUp, Ban } from 'lucide-react';
import { format, differenceInMinutes, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AccessLog {
  id: string;
  user_id: string;
  email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  action: string;
  created_at: string;
}

interface UserSession {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_activity: string;
  is_active: boolean;
}

interface Props {
  accessLogs: AccessLog[];
  sessions: UserSession[];
  onInvalidateAllSessions: (userId: string) => void;
}

interface UserLoginProfile {
  userId: string;
  email: string;
  uniqueIPs: string[];
  uniqueDevices: string[];
  loginCount: number;
  suspiciousEvents: SuspiciousEvent[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  activeSessions: number;
  lastLogin: string;
}

interface SuspiciousEvent {
  type: 'multi_ip' | 'rapid_switch' | 'multi_device' | 'unusual_hour';
  description: string;
  timestamp: string;
  details: string;
}

function parseDevice(ua: string | null): string {
  if (!ua || ua === 'unknown') return 'Desconhecido';
  const parts: string[] = [];
  if (ua.includes('Windows')) parts.push('Windows');
  else if (ua.includes('Mac')) parts.push('Mac');
  else if (ua.includes('Linux')) parts.push('Linux');
  else if (ua.includes('Android')) parts.push('Android');
  else if (ua.includes('iPhone') || ua.includes('iPad')) parts.push('iOS');

  if (ua.includes('Chrome') && !ua.includes('Edg')) parts.push('Chrome');
  else if (ua.includes('Firefox')) parts.push('Firefox');
  else if (ua.includes('Safari') && !ua.includes('Chrome')) parts.push('Safari');
  else if (ua.includes('Edg')) parts.push('Edge');

  return parts.length > 0 ? parts.join(' / ') : ua.substring(0, 30);
}

export default function LoginAnalyticsTab({ accessLogs, sessions, onInvalidateAllSessions }: Props) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [daysFilter, setDaysFilter] = useState(7);

  const analysis = useMemo(() => {
    const cutoff = subDays(new Date(), daysFilter);
    const loginLogs = accessLogs.filter(
      l => l.action === 'login' && new Date(l.created_at) >= cutoff
    );

    const byUser = new Map<string, AccessLog[]>();
    loginLogs.forEach(log => {
      const key = log.user_id;
      if (!byUser.has(key)) byUser.set(key, []);
      byUser.get(key)!.push(log);
    });

    const profiles: UserLoginProfile[] = [];

    byUser.forEach((logs, userId) => {
      const email = logs[0]?.email || 'N/A';
      const uniqueIPs = [...new Set(logs.map(l => l.ip_address).filter(Boolean) as string[])];
      const uniqueDevices = [...new Set(logs.map(l => parseDevice(l.user_agent)))];
      const suspiciousEvents: SuspiciousEvent[] = [];

      // Detect rapid IP switches (different IP within 30 min)
      const sorted = [...logs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        if (prev.ip_address && curr.ip_address && prev.ip_address !== curr.ip_address) {
          const diff = differenceInMinutes(new Date(curr.created_at), new Date(prev.created_at));
          if (diff <= 30) {
            suspiciousEvents.push({
              type: 'rapid_switch',
              description: `Troca de IP em ${diff} min`,
              timestamp: curr.created_at,
              details: `${prev.ip_address} → ${curr.ip_address}`
            });
          }
        }
      }

      // Multiple IPs
      if (uniqueIPs.length >= 3) {
        suspiciousEvents.push({
          type: 'multi_ip',
          description: `${uniqueIPs.length} IPs diferentes em ${daysFilter} dias`,
          timestamp: logs[0].created_at,
          details: uniqueIPs.join(', ')
        });
      }

      // Multiple devices
      if (uniqueDevices.length >= 3) {
        suspiciousEvents.push({
          type: 'multi_device',
          description: `${uniqueDevices.length} dispositivos diferentes`,
          timestamp: logs[0].created_at,
          details: uniqueDevices.join(', ')
        });
      }

      // Unusual hours (login between 00:00 - 05:00)
      const unusualLogins = logs.filter(l => {
        const h = new Date(l.created_at).getHours();
        return h >= 0 && h < 5;
      });
      if (unusualLogins.length > 0) {
        suspiciousEvents.push({
          type: 'unusual_hour',
          description: `${unusualLogins.length} login(s) em horário incomum (00h-05h)`,
          timestamp: unusualLogins[0].created_at,
          details: unusualLogins.map(l => format(new Date(l.created_at), 'dd/MM HH:mm')).join(', ')
        });
      }

      // Risk level
      let riskLevel: UserLoginProfile['riskLevel'] = 'low';
      const rapidSwitches = suspiciousEvents.filter(e => e.type === 'rapid_switch').length;
      if (rapidSwitches >= 3 || (uniqueIPs.length >= 5 && rapidSwitches >= 1)) {
        riskLevel = 'critical';
      } else if (rapidSwitches >= 2 || uniqueIPs.length >= 4) {
        riskLevel = 'high';
      } else if (rapidSwitches >= 1 || uniqueIPs.length >= 3) {
        riskLevel = 'medium';
      }

      const userActiveSessions = sessions.filter(s => s.user_id === userId && s.is_active).length;

      profiles.push({
        userId,
        email,
        uniqueIPs,
        uniqueDevices,
        loginCount: logs.length,
        suspiciousEvents,
        riskLevel,
        activeSessions: userActiveSessions,
        lastLogin: sorted[sorted.length - 1]?.created_at || ''
      });
    });

    // Sort by risk level
    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    profiles.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

    return profiles;
  }, [accessLogs, sessions, daysFilter]);

  const suspiciousCount = analysis.filter(p => p.riskLevel !== 'low').length;
  const criticalCount = analysis.filter(p => p.riskLevel === 'critical').length;

  const riskBadge = (level: UserLoginProfile['riskLevel']) => {
    switch (level) {
      case 'critical':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">🔴 Crítico</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">🟠 Alto</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">🟡 Médio</Badge>;
      default:
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">🟢 Normal</Badge>;
    }
  };

  const eventIcon = (type: SuspiciousEvent['type']) => {
    switch (type) {
      case 'rapid_switch': return <AlertTriangle className="h-3.5 w-3.5 text-red-400" />;
      case 'multi_ip': return <MapPin className="h-3.5 w-3.5 text-orange-400" />;
      case 'multi_device': return <Monitor className="h-3.5 w-3.5 text-yellow-400" />;
      case 'unusual_hour': return <Clock className="h-3.5 w-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários Analisados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.length}</div>
            <p className="text-xs text-muted-foreground">Últimos {daysFilter} dias</p>
          </CardContent>
        </Card>
        <Card className={suspiciousCount > 0 ? 'border-yellow-500/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Suspeitos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${suspiciousCount > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              {suspiciousCount}
            </div>
            <p className="text-xs text-muted-foreground">Risco médio ou superior</p>
          </CardContent>
        </Card>
        <Card className={criticalCount > 0 ? 'border-red-500/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${criticalCount > 0 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
              {criticalCount}
            </div>
            <p className="text-xs text-muted-foreground">Provável compartilhamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1">
              {[7, 15, 30].map(d => (
                <Button
                  key={d}
                  size="sm"
                  variant={daysFilter === d ? 'default' : 'outline'}
                  onClick={() => setDaysFilter(d)}
                  className="text-xs"
                >
                  {d}d
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Recommendations */}
      {suspiciousCount > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-400 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Recomendações de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1.5">
            {criticalCount > 0 && (
              <p className="text-red-400">
                ⚠️ <strong>{criticalCount} usuário(s) com risco crítico</strong> — Trocas rápidas de IP indicam compartilhamento de credenciais. Recomenda-se invalidar sessões e redefinir senha.
              </p>
            )}
            <p>📌 <strong>Sessão única</strong> — já ativa. Cada novo login derruba o anterior.</p>
            <p>🔑 <strong>Sugestão:</strong> Redefinir senha dos usuários críticos e comunicar que o compartilhamento é monitorado.</p>
            <p>📊 <strong>Monitore este painel semanalmente</strong> para detectar padrões recorrentes.</p>
          </CardContent>
        </Card>
      )}

      {/* User Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Análise por Usuário</CardTitle>
          <CardDescription>Detecção de padrões de login suspeitos nos últimos {daysFilter} dias</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead className="text-center">Logins</TableHead>
                <TableHead className="text-center">IPs</TableHead>
                <TableHead className="text-center">Dispositivos</TableHead>
                <TableHead className="text-center">Sessões Ativas</TableHead>
                <TableHead className="text-center">Risco</TableHead>
                <TableHead className="text-center">Alertas</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.map(profile => (
                <>
                  <TableRow
                    key={profile.userId}
                    className={`cursor-pointer hover:bg-muted/50 ${profile.riskLevel === 'critical' ? 'bg-red-500/5' : profile.riskLevel === 'high' ? 'bg-orange-500/5' : ''}`}
                    onClick={() => setExpandedUser(expandedUser === profile.userId ? null : profile.userId)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {expandedUser === profile.userId ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        <div>
                          <div className="font-medium text-sm">{profile.email}</div>
                          <div className="text-xs text-muted-foreground">
                            Último: {profile.lastLogin ? format(new Date(profile.lastLogin), 'dd/MM HH:mm', { locale: ptBR }) : '-'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono">{profile.loginCount}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-mono ${profile.uniqueIPs.length >= 3 ? 'text-orange-400 font-bold' : ''}`}>
                        {profile.uniqueIPs.length}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-mono ${profile.uniqueDevices.length >= 3 ? 'text-yellow-400 font-bold' : ''}`}>
                        {profile.uniqueDevices.length}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono">{profile.activeSessions}</TableCell>
                    <TableCell className="text-center">{riskBadge(profile.riskLevel)}</TableCell>
                    <TableCell className="text-center">
                      {profile.suspiciousEvents.length > 0 ? (
                        <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                          {profile.suspiciousEvents.length}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {profile.riskLevel !== 'low' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInvalidateAllSessions(profile.userId);
                          }}
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Derrubar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedUser === profile.userId && (
                    <TableRow key={`${profile.userId}-detail`}>
                      <TableCell colSpan={8} className="bg-muted/30 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* IPs */}
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> Endereços IP
                            </h4>
                            <div className="space-y-1">
                              {profile.uniqueIPs.map(ip => (
                                <div key={ip} className="text-xs font-mono bg-background/50 rounded px-2 py-1">
                                  {ip}
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Devices */}
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                              <Monitor className="h-3 w-3" /> Dispositivos
                            </h4>
                            <div className="space-y-1">
                              {profile.uniqueDevices.map(dev => (
                                <div key={dev} className="text-xs bg-background/50 rounded px-2 py-1">
                                  {dev}
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Suspicious Events */}
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Eventos Suspeitos
                            </h4>
                            {profile.suspiciousEvents.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Nenhum evento suspeito</p>
                            ) : (
                              <div className="space-y-2">
                                {profile.suspiciousEvents.map((evt, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs bg-background/50 rounded px-2 py-1.5">
                                    {eventIcon(evt.type)}
                                    <div>
                                      <div className="font-medium">{evt.description}</div>
                                      <div className="text-muted-foreground">{evt.details}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
              {analysis.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum login registrado nos últimos {daysFilter} dias
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
