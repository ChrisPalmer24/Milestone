import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Toast } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  CalendarIcon, 
  CheckIcon, 
  ChevronDownIcon, 
  PlusIcon, 
  MinusIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  DollarSignIcon,
  AlertTriangleIcon,
  InfoIcon,
  SettingsIcon,
  UserIcon,
  BellIcon,
  SearchIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Showcase() {
  const [sliderValue, setSliderValue] = useState([50]);
  const [progressValue, setProgressValue] = useState(65);
  const [date, setDate] = useState<Date>();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [switchValue, setSwitchValue] = useState(false);
  const [radioValue, setRadioValue] = useState("option1");
  const [toggleValue, setToggleValue] = useState("a");
  const { toast } = useToast();

  const portfolioData = [
    { name: "Stocks", value: 45000, percentage: 60, trend: "up" },
    { name: "Bonds", value: 22500, percentage: 30, trend: "stable" },
    { name: "Cash", value: 7500, percentage: 10, trend: "down" },
  ];

  const frameworks = [
    { value: "next.js", label: "Next.js" },
    { value: "sveltekit", label: "SvelteKit" },
    { value: "nuxt.js", label: "Nuxt.js" },
    { value: "remix", label: "Remix" },
    { value: "astro", label: "Astro" },
  ];

  const showToast = () => {
    toast({
      title: "Portfolio Updated",
      description: "Your investment portfolio has been successfully updated.",
    });
  };

  return (
    <div className="showcase-screen max-w-7xl mx-auto px-4 pb-20 space-y-8">
      <div className="pt-6">
        <h1 className="text-3xl font-bold mb-2">shadcn/ui Component Showcase</h1>
        <p className="text-gray-600 mb-8">
          Comprehensive demonstration of shadcn/ui components in a financial context
        </p>
      </div>

      {/* Tabs for Organization */}
      <Tabs defaultValue="forms" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="forms">Forms & Inputs</TabsTrigger>
          <TabsTrigger value="data">Data Display</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
        </TabsList>

        {/* Forms & Inputs Tab */}
        <TabsContent value="forms" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Basic Form Elements */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Form Elements</CardTitle>
                <CardDescription>Input fields, labels, and buttons</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="investment-amount">Investment Amount</Label>
                  <Input 
                    id="investment-amount" 
                    placeholder="Enter amount" 
                    type="number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Investment Notes</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Add notes about your investment..."
                    rows={3}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button>Save Investment</Button>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive">Delete</Button>
                </div>
              </CardContent>
            </Card>

            {/* Selection Components */}
            <Card>
              <CardHeader>
                <CardTitle>Selection Components</CardTitle>
                <CardDescription>Dropdowns, comboboxes, and toggles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Asset Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stocks">Stocks</SelectItem>
                      <SelectItem value="bonds">Bonds</SelectItem>
                      <SelectItem value="etfs">ETFs</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Investment Platform</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {value
                          ? frameworks.find((framework) => framework.value === value)?.label
                          : "Select platform..."}
                        <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search platform..." />
                        <CommandList>
                          <CommandEmpty>No platform found.</CommandEmpty>
                          <CommandGroup>
                            {frameworks.map((framework) => (
                              <CommandItem
                                key={framework.value}
                                value={framework.value}
                                onSelect={(currentValue) => {
                                  setValue(currentValue === value ? "" : currentValue);
                                  setOpen(false);
                                }}
                              >
                                <CheckIcon
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    value === framework.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {framework.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Risk Tolerance</Label>
                  <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="low" />
                      <Label htmlFor="low">Low Risk</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium">Medium Risk</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="high" />
                      <Label htmlFor="high">High Risk</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Interactive Controls</CardTitle>
                <CardDescription>Sliders, switches, and checkboxes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Investment Allocation: {sliderValue[0]}%</Label>
                  <Slider
                    value={sliderValue}
                    onValueChange={setSliderValue}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="auto-invest" 
                    checked={switchValue}
                    onCheckedChange={setSwitchValue}
                  />
                  <Label htmlFor="auto-invest">Enable Auto-Investing</Label>
                </div>

                <div className="space-y-3">
                  <Label>Investment Preferences</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="dividend" />
                    <Label htmlFor="dividend">Dividend Stocks</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="growth" />
                    <Label htmlFor="growth">Growth Stocks</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="esg" />
                    <Label htmlFor="esg">ESG Investing</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Investment Strategy</Label>
                  <ToggleGroup type="single" value={toggleValue} onValueChange={setToggleValue}>
                    <ToggleGroupItem value="conservative">Conservative</ToggleGroupItem>
                    <ToggleGroupItem value="balanced">Balanced</ToggleGroupItem>
                    <ToggleGroupItem value="aggressive">Aggressive</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </CardContent>
            </Card>

            {/* Date & Calendar */}
            <Card>
              <CardHeader>
                <CardTitle>Date Selection</CardTitle>
                <CardDescription>Calendar and date picker components</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Investment Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Data Display Tab */}
        <TabsContent value="data" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Portfolio Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Overview</CardTitle>
                <CardDescription>Asset allocation and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {portfolioData.map((asset, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-sm text-gray-500">{asset.percentage}% allocation</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">£{asset.value.toLocaleString()}</p>
                      <div className="flex items-center">
                        {asset.trend === "up" ? (
                          <TrendingUpIcon className="w-4 h-4 text-green-500" />
                        ) : asset.trend === "down" ? (
                          <TrendingDownIcon className="w-4 h-4 text-red-500" />
                        ) : (
                          <MinusIcon className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Progress & Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Investment Progress</CardTitle>
                <CardDescription>Goals and achievements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>FIRE Goal Progress</Label>
                    <span className="text-sm font-medium">{progressValue}%</span>
                  </div>
                  <Progress value={progressValue} className="w-full" />
                </div>

                <div className="space-y-3">
                  <Label>Investment Status</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Active Investor</Badge>
                    <Badge variant="secondary">ISA Holder</Badge>
                    <Badge variant="outline">SIPP Contributor</Badge>
                    <Badge variant="destructive">Risk Alert</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Account Summary</Label>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-gray-500">Premium Member</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scrollable List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest investment activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48 w-full">
                  <div className="space-y-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <DollarSignIcon className="w-4 h-4 text-green-500" />
                          <div>
                            <p className="text-sm font-medium">Investment #{i + 1}</p>
                            <p className="text-xs text-gray-500">2 days ago</p>
                          </div>
                        </div>
                        <Badge variant="outline">+£{(Math.random() * 1000).toFixed(0)}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Components</CardTitle>
                <CardDescription>Various alert states and messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Market Update</AlertTitle>
                  <AlertDescription>
                    Your portfolio has increased by 3.2% this week.
                  </AlertDescription>
                </Alert>

                <Alert variant="destructive">
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertTitle>Risk Warning</AlertTitle>
                  <AlertDescription>
                    Your portfolio allocation exceeds recommended risk levels.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Toast & Dialog */}
            <Card>
              <CardHeader>
                <CardTitle>Interactive Feedback</CardTitle>
                <CardDescription>Toasts, dialogs, and modals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={showToast} className="w-full">
                  Show Toast Notification
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Open Investment Dialog
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New Investment</DialogTitle>
                      <DialogDescription>
                        Add a new investment to your portfolio.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input id="amount" placeholder="Enter investment amount" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="asset">Asset</Label>
                        <Input id="asset" placeholder="Enter asset name" />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline">Cancel</Button>
                        <Button>Add Investment</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Navigation Tab */}
        <TabsContent value="navigation" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Dropdown Menu */}
            <Card>
              <CardHeader>
                <CardTitle>Dropdown Menus</CardTitle>
                <CardDescription>Context menus and dropdowns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      Portfolio Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Portfolio Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Add Investment
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <SearchIcon className="mr-2 h-4 w-4" />
                      Search Assets
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <TrendingUpIcon className="mr-2 h-4 w-4" />
                      View Performance
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <AlertTriangleIcon className="mr-2 h-4 w-4" />
                      Reset Portfolio
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <UserIcon className="mr-2 h-4 w-4" />
                      Account Menu
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                    <DropdownMenuItem>Billing</DropdownMenuItem>
                    <DropdownMenuItem>Team</DropdownMenuItem>
                    <DropdownMenuItem>Subscription</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Log out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>

            {/* Tabs Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>Tab Navigation</CardTitle>
                <CardDescription>Nested tabs and navigation</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="holdings">Holdings</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Portfolio overview with key metrics and allocation breakdown.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 border rounded">
                        <p className="text-sm font-medium">Total Value</p>
                        <p className="text-2xl font-bold">£75,000</p>
                      </div>
                      <div className="p-3 border rounded">
                        <p className="text-sm font-medium">Daily Change</p>
                        <p className="text-2xl font-bold text-green-600">+2.3%</p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="holdings" className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Detailed breakdown of your investment holdings.
                    </p>
                    <div className="space-y-2">
                      {portfolioData.map((asset, index) => (
                        <div key={index} className="flex justify-between p-2 border rounded">
                          <span>{asset.name}</span>
                          <span>£{asset.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="performance" className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Historical performance and analytics.
                    </p>
                    <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                      <p className="text-gray-500">Performance Chart Placeholder</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card Variations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSignIcon className="mr-2 h-5 w-5" />
                  Stocks
                </CardTitle>
                <CardDescription>Equity investments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£45,000</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUpIcon className="mr-2 h-5 w-5" />
                  Bonds
                </CardTitle>
                <CardDescription>Fixed income securities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£22,500</div>
                <p className="text-xs text-muted-foreground">+5.2% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BellIcon className="mr-2 h-5 w-5" />
                  Alerts
                </CardTitle>
                <CardDescription>Portfolio notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">New alerts today</p>
              </CardContent>
            </Card>
          </div>

          {/* Complex Layout Example */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Dashboard Layout</CardTitle>
              <CardDescription>
                Complex layout combining multiple components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Portfolio Performance</h3>
                    <Select defaultValue="1m">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1d">1 Day</SelectItem>
                        <SelectItem value="1w">1 Week</SelectItem>
                        <SelectItem value="1m">1 Month</SelectItem>
                        <SelectItem value="1y">1 Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="h-48 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart Component Would Go Here</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button className="w-full justify-start">
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Add Investment
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <SearchIcon className="mr-2 h-4 w-4" />
                      Search Assets
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      Portfolio Settings
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Recent Activity</h4>
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="text-sm p-2 bg-gray-50 rounded">
                            Investment #{i + 1} updated
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}