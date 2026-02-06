import { useState, useEffect } from "react";
import {
    Users, Coins, History, BarChart3, Search,
    Plus, Minus, ArrowLeft, Gem, LogOut,
    ChevronRight, Calendar, Mail, Image as ImageIcon,
    Check, User, Sparkles, RefreshCw, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/config/api";

const AdminPage = () => {
    const navigate = useNavigate();
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [adminUser, setAdminUser] = useState(null);
    const [loginData, setLoginData] = useState({ username: "", password: "" });

    // Data state
    const [users, setUsers] = useState([]);
    const [generations, setGenerations] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeView, setActiveView] = useState("analytics");
    const [searchQuery, setSearchQuery] = useState("");

    // Modal state for credit updates
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [creditAmount, setCreditAmount] = useState("10");
    const [modalOperation, setModalOperation] = useState("add"); // "add" or "remove"



    // Authentication
    const handleAdminLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(API_ENDPOINTS.ADMIN_LOGIN, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData),
            });

            if (response.ok) {
                const data = await response.json();
                setIsAdminLoggedIn(true);
                setAdminUser(data.user);
                toast.success("Admin access granted");
                fetchAdminData();
            } else {
                toast.error("Invalid admin credentials");
            }
        } catch (error) {
            toast.error("Login failed. Backend might be offline.");
        }
    };

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const [usersRes, genRes, analRes] = await Promise.all([
                fetch(API_ENDPOINTS.ADMIN_USERS),
                fetch(API_ENDPOINTS.ADMIN_GENERATIONS),
                fetch(API_ENDPOINTS.ADMIN_STATS)
            ]);

            if (usersRes.ok) setUsers(await usersRes.json() || []);
            if (genRes.ok) setGenerations(await genRes.json() || []);
            if (analRes.ok) setAnalytics(await analRes.json());
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCredits = async () => {
        if (!selectedUser || !creditAmount) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_ENDPOINTS.ADMIN_USERS}/update-credits`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: selectedUser.email,
                    amount: parseInt(creditAmount),
                    operation: modalOperation
                }),
            });

            if (response.ok) {
                toast.success(`Credits updated for ${selectedUser.email}`);
                setIsModalOpen(false);
                fetchAdminData();
            } else {
                toast.error("Failed to update credits");
            }
        } catch (error) {
            toast.error("Network error updating credits");
        } finally {
            setLoading(false);
        }
    };

    // Login View
    if (!isAdminLoggedIn) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md elegant-card">
                    <CardHeader className="text-center pb-2">
                        <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <Gem className="w-10 h-10 text-primary-foreground" />
                        </div>
                        <CardTitle className="font-display text-3xl">Admin Access</CardTitle>
                        <p className="text-muted-foreground mt-2">Enter credentials to manage JewelAI by Sanjeevan</p>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleAdminLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Username</label>
                                <Input
                                    value={loginData.username}
                                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                                    placeholder="admin-id"
                                    className="input-elegant"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Password</label>
                                <Input
                                    type="password"
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="input-elegant"
                                />
                            </div>
                            <Button type="submit" variant="premium" className="w-full h-12 text-lg mt-4">
                                Verify Identity
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full mt-2"
                                onClick={() => navigate("/")}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Store
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Admin Dashboard View
    return (
        <div className="min-h-screen bg-background flex flex-col lg:flex-row">
            {/* Sidebar */}
            <aside className="w-full lg:w-64 bg-card border-r border-border shrink-0">
                <div className="h-full flex flex-col p-6">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                            <Gem className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                            <span className="font-display text-lg font-semibold block">Admin Panel</span>
                            <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
                                JewelAI by <a href="https://www.linkedin.com/in/sanjeevansahu/" target="_blank" rel="noopener noreferrer" className="hover:underline">Sanjeevan</a>
                            </span>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <button
                            onClick={() => setActiveView("analytics")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeView === "analytics" ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-secondary text-muted-foreground"}`}
                        >
                            <BarChart3 className="w-5 h-5" /> Analytics
                        </button>
                        <button
                            onClick={() => setActiveView("users")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeView === "users" ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-secondary text-muted-foreground"}`}
                        >
                            <Users className="w-5 h-5" /> User Directory
                        </button>
                        <button
                            onClick={() => setActiveView("generations")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeView === "generations" ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-secondary text-muted-foreground"}`}
                        >
                            <History className="w-5 h-5" /> All Generations
                        </button>
                    </nav>

                    <div className="mt-auto pt-6 border-t border-border">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                                SJ
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-semibold truncate">{adminUser?.username}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Platform Admin</p>
                            </div>
                        </div>
                        <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10" onClick={() => setIsAdminLoggedIn(false)}>
                            <LogOut className="w-4 h-4 mr-2" /> Logout
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                    <div>
                        <h1 className="font-display text-4xl font-semibold capitalize">{activeView} Dashboard</h1>
                        <p className="text-muted-foreground mt-1 font-sans">Real-time platform monitoring and management</p>
                    </div>
                    <Button variant="outline" onClick={fetchAdminData} disabled={loading} className="gap-2">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
                    </Button>
                </header>

                {/* Analytics View */}
                {activeView === "analytics" && analytics && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <Card className="elegant-card relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                                <CardContent className="p-8">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                                            <Users className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <span className="text-muted-foreground font-medium">Total Users</span>
                                    </div>
                                    <p className="text-4xl font-display font-bold">{analytics.total_users}</p>
                                    <p className="text-xs text-success mt-2 font-medium flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Active Platform
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="elegant-card relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                                <CardContent className="p-8">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                            <ImageIcon className="w-6 h-6 text-primary" />
                                        </div>
                                        <span className="text-muted-foreground font-medium">Generations</span>
                                    </div>
                                    <p className="text-4xl font-display font-bold">{analytics.total_generations}</p>
                                    <p className="text-xs text-muted-foreground mt-2 font-medium">AI Photoshoots Created</p>
                                </CardContent>
                            </Card>

                            <Card className="elegant-card relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                                <CardContent className="p-8">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center">
                                            <Coins className="w-6 h-6 text-gold" />
                                        </div>
                                        <span className="text-muted-foreground font-medium">Circulating Credits</span>
                                    </div>
                                    <p className="text-4xl font-display font-bold">{analytics.platform_credits}</p>
                                    <p className="text-xs text-muted-foreground mt-2 font-medium">Total Balance Across All Users</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="elegant-card h-[400px] flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                <p className="font-medium">Hourly Traffic Chart Coming Soon</p>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Users View */}
                {activeView === "users" && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="relative max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                className="pl-12 input-elegant h-12"
                                placeholder="Search users by email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-4">
                            {users
                                .filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((u) => (
                                    <Card key={u.email} className="bg-card border-border overflow-hidden group hover:border-primary/30 transition-all">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                                                        <User className="w-7 h-7 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-lg">{u.name || u.email.split('@')[0]}</p>
                                                        <p className="text-xs text-muted-foreground mb-1">{u.email}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="secondary" className="text-[10px] uppercase">{u.role || 'user'}</Badge>
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" /> Joined {new Date(u.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center sm:items-end gap-3 px-6 py-4 bg-secondary/30 rounded-2xl min-w-[200px]">
                                                    <div className="flex items-center gap-2">
                                                        <Coins className="w-5 h-5 text-gold" />
                                                        <span className="text-2xl font-bold">{u.credits}</span>
                                                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Credits</span>
                                                    </div>
                                                    <div className="flex gap-2 w-full">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 gap-1 h-9 rounded-lg hover:bg-success/10 hover:text-success hover:border-success/30"
                                                            onClick={() => {
                                                                setSelectedUser(u);
                                                                setModalOperation("add");
                                                                setCreditAmount("10");
                                                                setIsModalOpen(true);
                                                            }}
                                                        >
                                                            <Plus className="w-3 h-3" /> Add
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 gap-1 h-9 rounded-lg hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                                            onClick={() => {
                                                                setSelectedUser(u);
                                                                setModalOperation("remove");
                                                                setCreditAmount("10");
                                                                setIsModalOpen(true);
                                                            }}
                                                        >
                                                            <Minus className="w-3 h-3" /> Remove
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>
                    </div>
                )}

                {/* Generations View */}
                {activeView === "generations" && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {generations.map((gen) => (
                                <Card key={gen.id} className="elegant-card overflow-hidden group">
                                    <div className="aspect-[4/3] relative bg-secondary overflow-hidden">
                                        {gen.generated_image ? (
                                            <img
                                                src={gen.generated_image}
                                                alt={gen.preset_name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Sparkles className="w-12 h-12 text-primary/20 animate-pulse" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            <Badge className="bg-success text-white border-none shadow-md">Completed</Badge>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="w-4 h-4 text-primary" />
                                            </div>
                                            <p className="text-sm font-medium truncate flex-1">{gen.email || 'Anonymous'}</p>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground uppercase tracking-widest font-bold">Jewellery</span>
                                                <span className="font-semibold text-foreground capitalize">{gen.jewellery_type}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground uppercase tracking-widest font-bold">Style</span>
                                                <span className="font-semibold text-foreground truncate max-w-[150px]">{gen.preset_name}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground uppercase tracking-widest font-bold">Created</span>
                                                <span className="font-semibold text-foreground">{new Date(gen.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        {generations.length === 0 && (
                            <div className="text-center py-20 opacity-30">
                                <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                                <p className="text-xl font-display">No generation records found</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Credit Update Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
                    <Card className="w-full max-w-sm elegant-card shadow-2xl animate-scale-in">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="font-display text-xl capitalize">
                                    {modalOperation} Credits
                                </CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">User: {selectedUser?.email}</p>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Enter Amount</Label>
                                <div className="relative">
                                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                                    <Input
                                        type="number"
                                        value={creditAmount}
                                        onChange={(e) => setCreditAmount(e.target.value)}
                                        className="pl-10 h-12 text-lg font-semibold"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant={modalOperation === "add" ? "premium" : "destructive"}
                                    className="flex-1"
                                    onClick={handleUpdateCredits}
                                    disabled={loading}
                                >
                                    {loading ? "Syncing..." : `Confirm ${modalOperation}`}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};


export default AdminPage;
