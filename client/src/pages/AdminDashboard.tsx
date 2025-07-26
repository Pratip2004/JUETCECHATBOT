import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  MessageSquare, 
  FileText, 
  Search, 
  Upload, 
  Trash2, 
  RefreshCw,
  LogOut,
  LayoutDashboard,
  User,
  History,
  Sun,
  Moon,
  X
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminService, DashboardMetrics, PDFDocument, User as UserType } from '../services/adminService';
import { useToast } from "../components/ui/use-toast";
import LogoutModal from '../components/auth/LogoutModal';

const AdminDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    totalQueries: 0,
    totalPDFs: 0,
    topQueries: [],
    recentActivity: []
  });
  const [pdfs, setPdfs] = useState<PDFDocument[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [year, setYear] = useState<string>('1');
  const [semester, setSemester] = useState<string>('1');
  const [subject, setSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [queriesOverTime, setQueriesOverTime] = useState<{ name: string; value: number }[]>([]);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [metricsData, pdfsData, queriesData] = await Promise.all([
        adminService.getDashboardMetrics(),
        adminService.getPDFs(),
        adminService.getQueriesOverTime()
      ]);
      setMetrics(metricsData);
      setPdfs(pdfsData);
      setQueriesOverTime(queriesData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !year || !semester || !subject) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select a file",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      await adminService.uploadPDF(selectedFile, year, semester, subject);
      toast({
        title: "Success",
        description: "PDF uploaded successfully",
      });
      setSelectedFile(null);
      setYear('1');
      setSemester('1');
      setSubject('');
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload PDF",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePDF = async (filename: string) => {
    try {
      await adminService.deletePDF(filename);
      toast({
        title: "Success",
        description: "PDF deleted successfully",
      });
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete PDF",
        variant: "destructive",
      });
    }
  };

  const handleReprocessPDF = async (filename: string) => {
    try {
      await adminService.reprocessPDF(filename);
      toast({
        title: "Success",
        description: "PDF reprocessed successfully",
      });
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reprocess PDF",
        variant: "destructive",
      });
    }
  };

  const handleUsersClick = async () => {
    try {
      setIsLoading(true);
      const usersData = await adminService.getAllUsers();
      setUsers(usersData);
      setShowUsersModal(true);
    } catch (error: any) {
      console.error('Error in handleUsersClick:', error);
      let errorMessage = 'Failed to fetch users';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication error. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to view users.';
      } else if (error.response?.status === 500) {
        errorMessage = `Server error: ${error.response?.data?.detail || 'Unknown error'}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (user: UserType) => {
    setSelectedUser(user);
    setShowUserDetailsModal(true);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setIsLogoutModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-foreground">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-accent"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700" />
                )}
              </button>
              <span className="text-sm font-medium text-foreground">{user?.username}</span>
              <Button variant="ghost" size="sm" onClick={handleLogoutClick}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sidebar Navigation */}
        <div className="flex gap-8">
          <div className="w-64 bg-card rounded-lg shadow-sm p-4">
            <nav className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-accent">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-foreground hover:bg-accent"
                onClick={handleUsersClick}
              >
                <User className="h-4 w-4 mr-2" />
                Users
              </Button>
              <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-accent">
                <History className="h-4 w-4 mr-2" />
                Chat Logs
              </Button>
              <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-accent">
                <FileText className="h-4 w-4 mr-2" />
                PDF Uploads
              </Button>
            </nav>
          </div>

          {/* Users Modal */}
          {showUsersModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-background rounded-lg p-6 w-[800px] max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Users</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowUsersModal(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mb-4">
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Social Links</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow 
                        key={user.username}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => handleUserClick(user)}
                      >
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.location || '-'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {user.github && (
                              <a 
                                href={user.github} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                GitHub
                              </a>
                            )}
                            {user.linkedin && (
                              <a 
                                href={user.linkedin} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                LinkedIn
                              </a>
                            )}
                            {user.portfolio && (
                              <a 
                                href={user.portfolio} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Portfolio
                              </a>
                            )}
                            {!user.github && !user.linkedin && !user.portfolio && '-'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* User Details Modal */}
          {showUserDetailsModal && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-background rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-foreground">User Details</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowUserDetailsModal(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Username</label>
                        <p className="text-foreground font-medium">{selectedUser.username}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Email</label>
                        <p className="text-foreground font-medium">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Role</label>
                        <Badge variant={selectedUser.role === 'admin' ? 'default' : 'secondary'}>
                          {selectedUser.role}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Created At</label>
                        <p className="text-foreground font-medium">
                          {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Mobile</label>
                        <p className="text-foreground font-medium">{selectedUser.mobile || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Location</label>
                        <p className="text-foreground font-medium">{selectedUser.location || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground">Social Links</h3>
                    <div className="space-y-2">
                      {selectedUser.github && (
                        <div>
                          <label className="text-sm text-muted-foreground">GitHub</label>
                          <a 
                            href={selectedUser.github} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block text-primary hover:underline"
                          >
                            {selectedUser.github}
                          </a>
                        </div>
                      )}
                      {selectedUser.linkedin && (
                        <div>
                          <label className="text-sm text-muted-foreground">LinkedIn</label>
                          <a 
                            href={selectedUser.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block text-primary hover:underline"
                          >
                            {selectedUser.linkedin}
                          </a>
                        </div>
                      )}
                      {selectedUser.portfolio && (
                        <div>
                          <label className="text-sm text-muted-foreground">Portfolio</label>
                          <a 
                            href={selectedUser.portfolio} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block text-primary hover:underline"
                          >
                            {selectedUser.portfolio}
                          </a>
                        </div>
                      )}
                      {!selectedUser.github && !selectedUser.linkedin && !selectedUser.portfolio && (
                        <p className="text-muted-foreground">No social links provided</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Metrics Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{metrics.totalUsers}</div>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total Queries</CardTitle>
                  <MessageSquare className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{metrics.totalQueries}</div>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total PDFs</CardTitle>
                  <FileText className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{metrics.totalPDFs}</div>
                </CardContent>
              </Card>
            </div>

            {/* Queries Over Time Chart */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Queries Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={queriesOverTime}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        dataKey="name" 
                        className="text-foreground"
                        tick={{ fill: theme === 'dark' ? '#e5e7eb' : '#374151' }}
                      />
                      <YAxis 
                        className="text-foreground"
                        tick={{ fill: theme === 'dark' ? '#e5e7eb' : '#374151' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          color: theme === 'dark' ? '#e5e7eb' : '#374151'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={theme === 'dark' ? '#8884d8' : '#6366f1'} 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Queries and Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Top Queries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.topQueries.map((query, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-foreground">{query.query}</span>
                        <Badge variant="secondary">{query.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.recentActivity.map((activity, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-foreground">{activity.query}</span>
                        <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PDF Management */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>PDF Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Year</label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full p-2 border rounded-md bg-background text-foreground"
                      >
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Semester</label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full p-2 border rounded-md bg-background text-foreground"
                      >
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-foreground mb-2 block">Subject</label>
                      <Input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Enter subject name"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <Button asChild>
                      <label htmlFor="pdf-upload" className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        {selectedFile ? selectedFile.name : 'Select PDF'}
                      </label>
                    </Button>
                    <Button 
                      onClick={handleUploadSubmit}
                      disabled={!selectedFile || !year || !semester || !subject || isUploading}
                    >
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </div>

                <div className="mt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Filename</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Pages</TableHead>
                        <TableHead>Uploaded At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pdfs.map((pdf, index) => (
                        <TableRow key={index}>
                          <TableCell>{pdf.filename}</TableCell>
                          <TableCell>{pdf.year || '-'}</TableCell>
                          <TableCell>{pdf.semester || '-'}</TableCell>
                          <TableCell>{pdf.subject || '-'}</TableCell>
                          <TableCell>{pdf.pages}</TableCell>
                          <TableCell>{pdf.uploadedAt}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReprocessPDF(pdf.filename)}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePDF(pdf.filename)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
};

export default AdminDashboard; 