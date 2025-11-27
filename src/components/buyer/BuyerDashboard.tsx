import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
  LayoutDashboard,
  Search,
  FileText, 
  Package,
  AlertCircle, 
  Eye, 
  X, 
  Clock, 
  Truck, 
  Star,
  Image as ImageIcon,
  ExternalLink,
  LogOut,
  Layers,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { SearchFilters } from '../SearchFilters';
import { SearchFabricCard } from '../SearchFabricCard';
import { SelectionPanel } from '../SelectionPanel';
import { MockupModal } from '../MockupModal';
import { TechpackModal } from '../TechpackModal';
import { Fabric, FabricFilter } from '../types';

type DashboardView = 'dashboard' | 'fabric-library' | 'rfqs' | 'samples' | 'designs';

// Types
interface BuyerDashboardData {
  buyer_dashboard: {
    stats: {
      active_rfqs: number;
      samples_in_transit: number;
      pending_actions: number;
    };
    recent_rfqs: RFQ[];
    sample_orders: SampleOrder[];
    saved_designs: SavedDesign[];
  };
}

interface RFQ {
  rfq_id: string;
  title: string;
  created_at?: string;
  status: string;
  admin_note?: string | null;
  attendance_count: number;
  actions?: string[];
  attendees_preview?: Attendee[];
}

interface Attendee {
  manufacturer_name: string;
  bid_price: string;
  rating: number;
}

interface SampleOrder {
  order_id: string;
  fabric_ref: string;
  manufacturer: string;
  status: string;
  tracking_timeline: TrackingEvent[];
  fee_status: string;
}

interface TrackingEvent {
  status: string;
  timestamp: string | null;
  completed: boolean;
  details?: string;
}

interface SavedDesign {
  id: string;
  name: string;
  preview_url: string;
  linked_rfq_id?: string;
}

// Mock data
const MOCK_DATA: BuyerDashboardData = {
  buyer_dashboard: {
    stats: {
      active_rfqs: 4,
      samples_in_transit: 2,
      pending_actions: 1
    },
    recent_rfqs: [
      {
        rfq_id: "RFQ-2024-88",
        title: "Heavy GSM Cotton Fleece",
        created_at: "2024-03-20T10:00:00Z",
        status: "APPROVED_OPEN",
        admin_note: "Approved, broadcast to 45 manufacturers.",
        attendance_count: 12,
        actions: ["view_attendees", "close_rfq"],
        attendees_preview: [
          { manufacturer_name: "FabCo Ltd", bid_price: "$4.50/yd", rating: 4.8 },
          { manufacturer_name: "Textile Bros", bid_price: "$4.20/yd", rating: 4.2 }
        ]
      },
      {
        rfq_id: "RFQ-2024-90",
        title: "Neon Polyester Mesh",
        status: "PENDING_ADMIN_APPROVAL",
        admin_note: null,
        attendance_count: 0
      }
    ],
    sample_orders: [
      {
        order_id: "SMP-999",
        fabric_ref: "FabCo-Cotton-01",
        manufacturer: "FabCo Ltd",
        status: "SHIPPED",
        tracking_timeline: [
          { status: "PLACED", timestamp: "2024-03-21T09:00:00Z", completed: true },
          { status: "PAID", timestamp: "2024-03-21T09:05:00Z", completed: true },
          { status: "PROCESSING", timestamp: "2024-03-22T14:00:00Z", completed: true },
          { status: "SHIPPED", timestamp: "2024-03-23T08:30:00Z", completed: true, details: "Courier: Pathao, ID: 778899" },
          { status: "DELIVERED", timestamp: null, completed: false }
        ],
        fee_status: "PAID_HELD_BY_PLATFORM"
      }
    ],
    saved_designs: [
      {
        id: "MOCK-55",
        name: "Summer Collection Hoodie",
        preview_url: "/static/mockups/user_123_hoodie.jpg",
        linked_rfq_id: "RFQ-2024-88"
      }
    ]
  }
};

export const BuyerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [data] = useState<BuyerDashboardData>(MOCK_DATA);
  const [activeView, setActiveView] = useState<DashboardView>('fabric-library');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Search/Fabric Library State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FabricFilter>({ fabrication: '', type: '', gsmRange: '' });
  const [selectedFabrics, setSelectedFabrics] = useState<Fabric[]>([]);
  const [mockupModalFabric, setMockupModalFabric] = useState<Fabric | null>(null);
  const [techpackModalFabric, setTechpackModalFabric] = useState<Fabric | null>(null);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'APPROVED_OPEN': { label: 'Open', variant: 'default' },
      'PENDING_ADMIN_APPROVAL': { label: 'Pending Approval', variant: 'secondary' },
      'SHIPPED': { label: 'Shipped', variant: 'default' },
      'DELIVERED': { label: 'Delivered', variant: 'default' },
      'PLACED': { label: 'Placed', variant: 'secondary' },
      'PAID': { label: 'Paid', variant: 'default' },
      'PROCESSING': { label: 'Processing', variant: 'secondary' }
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
    return (
      <Badge variant={statusInfo.variant} className="text-xs">
        {statusInfo.label}
      </Badge>
    );
  };

  // Fetch fabrics for search
  React.useEffect(() => {
    const hasSearchCriteria = searchTerm.trim() !== '' ||
      filters.fabrication !== '' ||
      filters.type !== '' ||
      filters.gsmRange !== '';

    if (!hasSearchCriteria) {
      setFabrics([]);
      setHasMore(false);
      setTotalResults(0);
      setIsLoading(false);
      return;
    }

    const fetchFabrics = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', '20');
        if (searchTerm) params.append('search', searchTerm);
        if (filters.fabrication) params.append('group', filters.fabrication);
        if (filters.gsmRange) params.append('weight', filters.gsmRange);

        const response = await fetch(`/api/find-fabrics?${params.toString()}`);
        if (response.ok) {
          const result = await response.json();
          if (page === 1) {
            setFabrics(result.data);
          } else {
            setFabrics(prev => [...prev, ...result.data]);
          }
          setHasMore(result.has_more);
          setTotalResults(result.total);
        }
      } catch (error) {
        console.error('Error fetching fabrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchFabrics();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters, page]);

  React.useEffect(() => {
    setPage(1);
    setFabrics([]);
  }, [searchTerm, filters]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  // Auto-collapse sidebar when user interacts with content area
  const handleContentClick = (e: React.MouseEvent) => {
    // Don't collapse if clicking on the toggle button or sidebar
    const target = e.target as HTMLElement;
    const isToggleButton = target.closest('[data-sidebar-toggle]');
    const isSidebar = target.closest('[data-sidebar]');
    
    if (!isToggleButton && !isSidebar && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const menuItems = [
    { id: 'fabric-library' as DashboardView, label: 'Fabric Library', icon: Search },
    { id: 'dashboard' as DashboardView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rfqs' as DashboardView, label: 'RFQs', icon: FileText },
    { id: 'samples' as DashboardView, label: 'Samples', icon: Package },
    { id: 'designs' as DashboardView, label: 'Saved Designs', icon: ImageIcon },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'fabric-library':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Fabric Library</h1>
              <p className="text-neutral-500">Search by fabrication, code, composition, or mill.</p>
            </div>

            <div className="mb-6">
              <div className="relative max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-11 pr-4 py-3 border border-neutral-200 rounded-lg leading-5 bg-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition duration-150 ease-in-out sm:text-sm"
                  placeholder="Search fabrics (e.g. 'Organic Cotton', 'Fleece', 'Masco Knits')..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-6">
              <SearchFilters 
                filters={filters}
                setFilters={setFilters}
              />
            </div>

            {fabrics.length > 0 && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-neutral-500">
                  {totalResults} {totalResults === 1 ? 'fabric' : 'fabrics'} found
                </p>
              </div>
            )}

            {fabrics.length === 0 && !isLoading && (searchTerm || filters.fabrication || filters.type || filters.gsmRange) && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                  <Search className="w-8 h-8 text-neutral-400" />
                </div>
                <p className="text-neutral-500">No fabrics found. Try adjusting your search.</p>
              </div>
            )}

            {fabrics.length === 0 && !isLoading && !searchTerm && !filters.fabrication && !filters.type && !filters.gsmRange && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                  <Search className="w-8 h-8 text-neutral-400" />
                </div>
                <p className="text-neutral-500 font-medium">Start Your Fabric Search</p>
              </div>
            )}

            {isLoading && fabrics.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
                <p className="text-neutral-500 mt-4">Searching fabrics...</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {fabrics.map((fabric) => {
                const fabricId = fabric.ref || fabric.id;
                return (
                  <SearchFabricCard
                    key={fabricId}
                    fabric={fabric}
                    isSelected={!!selectedFabrics.find(f => (f.ref || f.id) === fabricId)}
                    onToggleSelect={(f) => {
                      const id = f.ref || f.id;
                      if (selectedFabrics.find(sf => (sf.ref || sf.id) === id)) {
                        setSelectedFabrics(selectedFabrics.filter(sf => (sf.ref || sf.id) !== id));
                      } else {
                        setSelectedFabrics([...selectedFabrics, f]);
                      }
                    }}
                    onOpenMockup={setMockupModalFabric}
                    onOpenTechpack={setTechpackModalFabric}
                  />
                );
              })}
            </div>

            {hasMore && (
              <div className="text-center py-4">
                <Button onClick={handleLoadMore} variant="outline" disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard</h1>
              <p className="text-neutral-500">Overview of your RFQs, samples, and activities</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500 mb-1">Active RFQs</p>
                    <p className="text-3xl font-bold text-neutral-900">{data.buyer_dashboard.stats.active_rfqs}</p>
                  </div>
                  <div className="p-3 bg-primary-50 rounded-full">
                    <FileText className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500 mb-1">Samples in Transit</p>
                    <p className="text-3xl font-bold text-neutral-900">{data.buyer_dashboard.stats.samples_in_transit}</p>
                  </div>
                  <div className="p-3 bg-accent-50 rounded-full">
                    <Truck className="w-6 h-6 text-accent-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500 mb-1">Pending Actions</p>
                    <p className="text-3xl font-bold text-neutral-900">{data.buyer_dashboard.stats.pending_actions}</p>
                  </div>
                  <div className="p-3 bg-warning-50 rounded-full">
                    <AlertCircle className="w-6 h-6 text-warning-400" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent RFQs */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-neutral-900">Recent RFQs</h2>
                <Button variant="outline" size="sm" onClick={() => setActiveView('rfqs')}>View All</Button>
              </div>
              <div className="space-y-4">
                {data.buyer_dashboard.recent_rfqs.slice(0, 2).map((rfq) => (
                  <Card key={rfq.rfq_id} className="p-6 bg-white border border-neutral-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-neutral-900">{rfq.title}</h3>
                          {getStatusBadge(rfq.status)}
                        </div>
                        <p className="text-sm text-neutral-500">RFQ ID: {rfq.rfq_id}</p>
                      </div>
                    </div>
                    {rfq.admin_note && (
                      <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-md">
                        <p className="text-sm text-primary-900">{rfq.admin_note}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 'rfqs':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">RFQs</h1>
              <p className="text-neutral-500">Manage your Request for Quotations</p>
            </div>
            <div className="space-y-4">
              {data.buyer_dashboard.recent_rfqs.map((rfq) => (
                <Card key={rfq.rfq_id} className="p-6 bg-white border border-neutral-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">{rfq.title}</h3>
                        {getStatusBadge(rfq.status)}
                      </div>
                      <p className="text-sm text-neutral-500">RFQ ID: {rfq.rfq_id}</p>
                      {rfq.created_at && (
                        <p className="text-xs text-neutral-400 mt-1">Created: {formatDate(rfq.created_at)}</p>
                      )}
                    </div>
                  </div>
                  {rfq.admin_note && (
                    <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-md">
                      <p className="text-sm text-primary-900">{rfq.admin_note}</p>
                    </div>
                  )}
                  {rfq.attendance_count > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-neutral-700 mb-2">
                        {rfq.attendance_count} {rfq.attendance_count === 1 ? 'Manufacturer' : 'Manufacturers'} Attending
                      </p>
                      {rfq.attendees_preview && rfq.attendees_preview.length > 0 && (
                        <div className="space-y-2">
                          {rfq.attendees_preview.map((attendee, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-neutral-50 rounded-md">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-neutral-900">{attendee.manufacturer_name}</span>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-warning-400 text-warning-400" />
                                  <span className="text-xs text-neutral-600">{attendee.rating}</span>
                                </div>
                              </div>
                              <span className="text-sm font-semibold text-primary-600">{attendee.bid_price}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {rfq.actions && rfq.actions.length > 0 && (
                    <div className="flex gap-2 mt-4">
                      {rfq.actions.includes('view_attendees') && (
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          View Attendees
                        </Button>
                      )}
                      {rfq.actions.includes('close_rfq') && (
                        <Button variant="destructive" size="sm" className="flex items-center gap-2">
                          <X className="w-4 h-4" />
                          Close RFQ
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );

      case 'samples':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Sample Orders</h1>
              <p className="text-neutral-500">Track your sample orders and deliveries</p>
            </div>
            <div className="space-y-4">
              {data.buyer_dashboard.sample_orders.map((order) => (
                <Card key={order.order_id} className="p-6 bg-white border border-neutral-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-1">{order.fabric_ref}</h3>
                      <p className="text-sm text-neutral-500">Order ID: {order.order_id}</p>
                      <p className="text-sm text-neutral-500">Manufacturer: {order.manufacturer}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-neutral-700 mb-4">Tracking Timeline</h4>
                    <div className="space-y-4">
                      {order.tracking_timeline.map((event, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              event.completed ? 'bg-primary-600' : 'bg-neutral-300 border-2 border-neutral-400'
                            }`} />
                            {idx < order.tracking_timeline.length - 1 && (
                              <div className={`w-0.5 h-12 ${event.completed ? 'bg-primary-600' : 'bg-neutral-300'}`} />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`text-sm font-medium ${event.completed ? 'text-neutral-900' : 'text-neutral-400'}`}>
                                {event.status}
                              </p>
                              {event.completed && event.timestamp && (
                                <Clock className="w-3 h-3 text-neutral-400" />
                              )}
                            </div>
                            {event.timestamp && (
                              <p className="text-xs text-neutral-500 mb-1">{formatDate(event.timestamp)}</p>
                            )}
                            {event.details && (
                              <p className="text-xs text-neutral-600 mt-1">{event.details}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <p className="text-xs text-neutral-500">
                      Fee Status: <span className="font-medium text-neutral-700">{order.fee_status.replace(/_/g, ' ')}</span>
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'designs':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Saved Designs</h1>
              <p className="text-neutral-500">Your saved mockup designs</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.buyer_dashboard.saved_designs.map((design) => (
                <Card key={design.id} className="p-4 bg-white border border-neutral-200 hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-neutral-100 rounded-md mb-3 flex items-center justify-center overflow-hidden">
                    <ImageIcon className="w-12 h-12 text-neutral-400" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-1">{design.name}</h3>
                  <p className="text-xs text-neutral-500 mb-3">ID: {design.id}</p>
                  {design.linked_rfq_id && (
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        Linked to {design.linked_rfq_id}
                      </Badge>
                      <Button variant="ghost" size="sm" className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 flex">
      {/* Sidebar */}
      <div 
        data-sidebar
        className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-neutral-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden relative`}
      >
        {/* Logo */}
        {sidebarOpen && (
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary-50 rounded-lg">
                <Layers className="w-6 h-6 text-primary-600" />
              </div>
              <span className="text-xl font-bold text-neutral-900">LinkER</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        {sidebarOpen && (
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    // Optionally close sidebar on mobile after selection
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* User Info & Logout */}
        {sidebarOpen && (
          <div className="p-4 border-t border-neutral-200">
            <div className="mb-3 p-3 bg-neutral-50 rounded-lg">
              <p className="text-xs text-neutral-500 mb-1 whitespace-nowrap">Logged in as</p>
              <p className="text-sm font-semibold text-neutral-900 truncate">{user?.name || 'Buyer'}</p>
            </div>
            <Button
              variant="ghost"
              onClick={logout}
              className="w-full flex items-center gap-2 justify-start text-neutral-600 hover:text-neutral-900"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Logout</span>
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-neutral-200 px-4 sm:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                data-sidebar-toggle
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center justify-center"
              >
                {sidebarOpen ? (
                  <ChevronLeft className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
              <div>
                <p className="text-sm text-neutral-500">Welcome back, {user?.name || 'Buyer'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto" onClick={handleContentClick}>
          <div className="max-w-7xl mx-auto px-8 py-8">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Selection Panel */}
      {selectedFabrics.length > 0 && (
        <SelectionPanel
          selectedFabrics={selectedFabrics}
          onRemove={(id) => setSelectedFabrics(selectedFabrics.filter(f => (f.ref || f.id) !== id))}
          onClear={() => setSelectedFabrics([])}
        />
      )}

      {/* Modals */}
      {mockupModalFabric && (
        <MockupModal
          fabric={mockupModalFabric}
          isSelected={!!selectedFabrics.find(f => (f.ref || f.id) === (mockupModalFabric.ref || mockupModalFabric.id))}
          onToggleSelect={(fabric) => {
            const id = fabric.ref || fabric.id;
            if (selectedFabrics.find(sf => (sf.ref || sf.id) === id)) {
              setSelectedFabrics(selectedFabrics.filter(sf => (sf.ref || sf.id) !== id));
            } else {
              setSelectedFabrics([...selectedFabrics, fabric]);
            }
          }}
          onClose={() => setMockupModalFabric(null)}
        />
      )}

      {techpackModalFabric && (
        <TechpackModal
          fabric={techpackModalFabric}
          onClose={() => setTechpackModalFabric(null)}
        />
      )}
    </div>
  );
};
