export interface MvcEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    route: string;
    action: string;
    description: string;
    auth: string;
    returns: string;
    controller: string;
}

export interface MvcPackage { name: string; version: string; }
export interface MvcArch { label: string; desc: string; icon: string; }
export interface MvcStat { label: string; value: string; icon: string; }
export interface MvcDbTable { name: string; columns: number; description: string; }

export interface MvcProject {
    id: string;
    name: string;
    tagline: string;
    description: string;
    icon: string;
    color: string;
    techStack: string[];
    features: string[];
    packages: MvcPackage[];
    architecture: MvcArch[];
    stats: MvcStat[];
    endpoints: MvcEndpoint[];
    dbTables: MvcDbTable[];
    projectTree: string;
    identityConfig: string;
}

export const MVC_PROJECTS: MvcProject[] = [
    {
        id: 'creatorhub',
        name: 'CreatorHub',
        tagline: 'Content creator platform',
        description: 'Full-featured MVC platform for creators to publish episodic content with user accounts, email confirmations, and a clean Repository + UnitOfWork architecture.',
        icon: '🎬',
        color: '#af52de',
        techStack: ['ASP.NET Core MVC', 'EF Core', 'Identity', 'SQL Server', 'MailKit'],
        features: [
            'Identity auth with lockout + email confirmation',
            'Repository + UnitOfWork pattern',
            'MailKit transactional emails',
            'Custom Toast notification system',
            'Role-based authorization (Admin, Creator)',
            'ContentProject + Episode nested CRUD',
            'DbSeeder with default roles',
            'Razor Views with Tailwind CSS',
        ],
        packages: [
            { name: 'Microsoft.EntityFrameworkCore.SqlServer', version: '9.0.0' },
            { name: 'Microsoft.AspNetCore.Identity.EntityFrameworkCore', version: '9.0.0' },
            { name: 'Microsoft.EntityFrameworkCore.Tools', version: '9.0.0' },
            { name: 'MailKit', version: '4.8.0' },
        ],
        architecture: [
            { label: 'Controllers', desc: '8 controllers handling HTTP', icon: '🎮' },
            { label: 'Services', desc: 'Email + business logic', icon: '⚙️' },
            { label: 'Repositories', desc: 'Generic Repo + UnitOfWork', icon: '🗄' },
            { label: 'ViewModels', desc: 'Separate DTOs per view', icon: '📦' },
            { label: 'Data', desc: 'AppDbContext + DbSeeder', icon: '💾' },
            { label: 'Views', desc: 'Razor + Tailwind + Toast', icon: '🎨' },
        ],
        stats: [
            { label: 'Controllers', value: '8', icon: '🎮' },
            { label: 'Endpoints', value: '24', icon: '🔌' },
            { label: 'Entities', value: '6', icon: '📊' },
            { label: 'Roles', value: '3', icon: '🛡' },
        ],
        endpoints: [
            { method: 'GET', route: '/', action: 'Home.Index', description: 'Homepage with latest content', auth: 'Anonymous', returns: 'View(latestContent)', controller: 'Home' },
            { method: 'GET', route: '/Home/Privacy', action: 'Home.Privacy', description: 'Static privacy page', auth: 'Anonymous', returns: 'View()', controller: 'Home' },
            { method: 'GET', route: '/Home/Error', action: 'Home.Error', description: 'Global error handler', auth: 'Anonymous', returns: 'View()', controller: 'Home' },
            { method: 'GET', route: '/Account/Register', action: 'Account.Register', description: 'Registration form', auth: 'Anonymous', returns: 'View()', controller: 'Account' },
            { method: 'POST', route: '/Account/Register', action: 'Account.Register', description: 'Create + welcome email', auth: 'Anonymous', returns: 'RedirectToAction("Index","Home")', controller: 'Account' },
            { method: 'GET', route: '/Account/Login', action: 'Account.Login', description: 'Login form', auth: 'Anonymous', returns: 'View()', controller: 'Account' },
            { method: 'POST', route: '/Account/Login', action: 'Account.Login', description: 'Sign in with lockout', auth: 'Anonymous', returns: 'RedirectToAction("Index","Home")', controller: 'Account' },
            { method: 'POST', route: '/Account/Logout', action: 'Account.Logout', description: 'Sign out', auth: 'Authorize', returns: 'RedirectToAction("Index","Home")', controller: 'Account' },
            { method: 'GET', route: '/Account/AccessDenied', action: 'Account.AccessDenied', description: '403 page', auth: 'Anonymous', returns: 'View()', controller: 'Account' },
            { method: 'GET', route: '/Projects', action: 'Projects.Index', description: 'List all projects', auth: 'Anonymous', returns: 'View(List<ContentProject>)', controller: 'Projects' },
            { method: 'GET', route: '/Projects/Details/{id}', action: 'Projects.Details', description: 'Project + episodes', auth: 'Anonymous', returns: 'View(ContentProject) | NotFound()', controller: 'Projects' },
            { method: 'GET', route: '/Projects/Create', action: 'Projects.Create', description: 'New project form', auth: 'Authorize', returns: 'View()', controller: 'Projects' },
            { method: 'POST', route: '/Projects/Create', action: 'Projects.Create', description: 'Save + cover upload', auth: 'Authorize', returns: 'RedirectToAction("Index")', controller: 'Projects' },
            { method: 'POST', route: '/Projects/PreviewCover', action: 'Projects.PreviewCover', description: 'AJAX cover preview', auth: 'Authorize', returns: 'Json({ url })', controller: 'Projects' },
            { method: 'GET', route: '/Projects/Edit/{id}', action: 'Projects.Edit', description: 'Edit form', auth: 'Authorize(Owner)', returns: 'View(ContentProject) | Forbid()', controller: 'Projects' },
            { method: 'POST', route: '/Projects/Edit/{id}', action: 'Projects.Edit', description: 'Update project', auth: 'Authorize(Owner)', returns: 'RedirectToAction("Index")', controller: 'Projects' },
            { method: 'POST', route: '/Projects/Delete/{id}', action: 'Projects.DeleteConfirmed', description: 'Cascade delete', auth: 'Authorize(Owner)', returns: 'RedirectToAction("Index")', controller: 'Projects' },
            { method: 'GET', route: '/Episodes/Details/{id}', action: 'Episodes.Details', description: 'Episode player', auth: 'Anonymous', returns: 'View(Episode)', controller: 'Episodes' },
            { method: 'GET', route: '/Episodes/Create/{projectId}', action: 'Episodes.Create', description: 'New episode form', auth: 'Authorize(Owner)', returns: 'View()', controller: 'Episodes' },
            { method: 'POST', route: '/Episodes/Create/{projectId}', action: 'Episodes.Create', description: 'Upload video + thumbnail', auth: 'Authorize(Owner)', returns: 'RedirectToAction("Details","Projects")', controller: 'Episodes' },
            { method: 'POST', route: '/Episodes/Increment/{id}', action: 'Episodes.Increment', description: 'View counter (AJAX)', auth: 'Anonymous', returns: 'Json({ views })', controller: 'Episodes' },
            { method: 'GET', route: '/Dashboard', action: 'Dashboard.Index', description: 'Creator dashboard', auth: 'Authorize', returns: 'View(DashboardViewModel)', controller: 'Dashboard' },
            { method: 'GET', route: '/Dashboard/Analytics', action: 'Dashboard.Analytics', description: 'Charts + stats', auth: 'Authorize', returns: 'View(AnalyticsViewModel)', controller: 'Dashboard' },
            { method: 'GET', route: '/Admin/Users', action: 'Admin.Users', description: 'User management', auth: 'Authorize(Roles=Admin)', returns: 'View(List<ApplicationUser>)', controller: 'Admin' },
            { method: 'POST', route: '/Admin/Users/{id}/Role', action: 'Admin.ChangeRole', description: 'Change user role', auth: 'Authorize(Roles=Admin)', returns: 'Json({ success })', controller: 'Admin' },
        ],
        dbTables: [
            { name: 'AspNetUsers', columns: 16, description: 'ApplicationUser extends IdentityUser with DisplayName, Bio, ProfileImagePath' },
            { name: 'AspNetRoles', columns: 4, description: 'Admin, Creator roles' },
            { name: 'AspNetUserRoles', columns: 2, description: 'User-Role mapping' },
            { name: 'ContentProjects', columns: 8, description: 'Title, Description, Category, CoverImagePath, UserId' },
            { name: 'Episodes', columns: 11, description: 'Title, EpisodeNumber, VideoPath, ViewsCount, ContentProjectId' },
        ],
        projectTree: `CreatorHub/
├── Controllers/
│   ├── HomeController.cs
│   ├── AccountController.cs
│   ├── ProjectsController.cs
│   ├── EpisodesController.cs
│   ├── DashboardController.cs
│   └── AdminController.cs
├── Models/
│   ├── ApplicationUser.cs
│   ├── ContentProject.cs
│   └── Episode.cs
├── ViewModels/
│   ├── RegisterViewModel.cs
│   ├── LoginViewModel.cs
│   ├── DashboardViewModel.cs
│   └── AnalyticsViewModel.cs
├── Data/
│   ├── AppDbContext.cs
│   └── DbSeeder.cs
├── Repositories/
│   ├── IRepository.cs
│   ├── Repository.cs
│   ├── IUnitOfWork.cs
│   └── UnitOfWork.cs
├── Services/
│   ├── IEmailService.cs
│   ├── EmailService.cs
│   └── EmailTemplates.cs
├── Views/
│   ├── Shared/
│   │   ├── _Layout.cshtml
│   │   └── _ToastContainer.cshtml
│   ├── Account/
│   ├── Projects/
│   ├── Episodes/
│   └── Dashboard/
├── wwwroot/uploads/
├── appsettings.json
└── Program.cs`,
        identityConfig: `builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequiredLength = 6;
    options.SignIn.RequireConfirmedEmail = false;
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(10);
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();`,
    },
    {
        id: 'shopflow',
        name: 'ShopFlow MVC',
        tagline: 'E-commerce platform',
        description: 'Complete e-commerce MVC application with product catalog, session cart, order workflow, Stripe payment integration, and a role-based admin area with analytics.',
        icon: '🛍',
        color: '#007aff',
        techStack: ['ASP.NET Core MVC', 'EF Core', 'Identity', 'SQL Server', 'Stripe.NET', 'Session'],
        features: [
            'Product catalog with filters + search',
            'Session-based shopping cart',
            'Stripe payment integration (test mode)',
            'Admin area with role-based access',
            'Order status workflow',
            'Product image uploads',
            'Customer reviews + ratings',
            'Sales analytics dashboard',
        ],
        packages: [
            { name: 'Microsoft.EntityFrameworkCore.SqlServer', version: '9.0.0' },
            { name: 'Microsoft.AspNetCore.Identity.EntityFrameworkCore', version: '9.0.0' },
            { name: 'Stripe.net', version: '47.0.0' },
            { name: 'PagedList.Mvc', version: '4.5.0' },
            { name: 'Microsoft.AspNetCore.Session', version: '9.0.0' },
        ],
        architecture: [
            { label: 'Areas', desc: 'Admin + Customer separated', icon: '📂' },
            { label: 'Services', desc: 'Cart, Payment, Email', icon: '⚙️' },
            { label: 'Session', desc: 'Server-side cart state', icon: '🛒' },
            { label: 'Repositories', desc: 'Generic repository layer', icon: '🗄' },
            { label: 'ViewComponents', desc: 'Cart badge, Category nav', icon: '🧩' },
            { label: 'Filters', desc: 'Custom admin filter', icon: '🎯' },
        ],
        stats: [
            { label: 'Controllers', value: '9', icon: '🎮' },
            { label: 'Endpoints', value: '28', icon: '🔌' },
            { label: 'Entities', value: '8', icon: '📊' },
            { label: 'Areas', value: '2', icon: '📂' },
        ],
        endpoints: [
            { method: 'GET', route: '/', action: 'Home.Index', description: 'Featured products + categories', auth: 'Anonymous', returns: 'View(HomeViewModel)', controller: 'Home' },
            { method: 'GET', route: '/Products', action: 'Products.Index', description: 'Catalog with filters + pagination', auth: 'Anonymous', returns: 'View(PagedList<Product>)', controller: 'Products' },
            { method: 'GET', route: '/Products/Details/{id}', action: 'Products.Details', description: 'Product detail + reviews', auth: 'Anonymous', returns: 'View(Product) | NotFound()', controller: 'Products' },
            { method: 'GET', route: '/Products/Search', action: 'Products.Search', description: 'Search (AJAX)', auth: 'Anonymous', returns: 'Json(List<ProductDto>)', controller: 'Products' },
            { method: 'GET', route: '/Cart', action: 'Cart.Index', description: 'Shopping cart view', auth: 'Anonymous', returns: 'View(CartViewModel)', controller: 'Cart' },
            { method: 'POST', route: '/Cart/Add/{productId}', action: 'Cart.Add', description: 'Add to cart (AJAX)', auth: 'Anonymous', returns: 'Json({ cartCount, total })', controller: 'Cart' },
            { method: 'POST', route: '/Cart/Update', action: 'Cart.Update', description: 'Update item quantity', auth: 'Anonymous', returns: 'Json({ newTotal })', controller: 'Cart' },
            { method: 'POST', route: '/Cart/Remove/{productId}', action: 'Cart.Remove', description: 'Remove item', auth: 'Anonymous', returns: 'Json({ cartCount })', controller: 'Cart' },
            { method: 'GET', route: '/Checkout', action: 'Checkout.Index', description: 'Checkout form', auth: 'Authorize', returns: 'View(CheckoutViewModel)', controller: 'Checkout' },
            { method: 'POST', route: '/Checkout/PlaceOrder', action: 'Checkout.PlaceOrder', description: 'Create order + Stripe charge', auth: 'Authorize', returns: 'RedirectToAction("Confirmation")', controller: 'Checkout' },
            { method: 'GET', route: '/Checkout/Confirmation/{id}', action: 'Checkout.Confirmation', description: 'Success page', auth: 'Authorize', returns: 'View(Order)', controller: 'Checkout' },
            { method: 'GET', route: '/Orders', action: 'Orders.Index', description: 'Order history', auth: 'Authorize', returns: 'View(List<Order>)', controller: 'Orders' },
            { method: 'GET', route: '/Orders/Details/{id}', action: 'Orders.Details', description: 'Order detail + tracking', auth: 'Authorize', returns: 'View(Order)', controller: 'Orders' },
            { method: 'POST', route: '/Orders/Cancel/{id}', action: 'Orders.Cancel', description: 'Cancel pending order', auth: 'Authorize', returns: 'RedirectToAction("Index")', controller: 'Orders' },
            { method: 'GET', route: '/Reviews/Create/{productId}', action: 'Reviews.Create', description: 'Review form', auth: 'Authorize', returns: 'View()', controller: 'Reviews' },
            { method: 'POST', route: '/Reviews/Create/{productId}', action: 'Reviews.Create', description: 'Submit review', auth: 'Authorize', returns: 'RedirectToAction("Details","Products")', controller: 'Reviews' },
            { method: 'GET', route: '/Admin', action: 'Dashboard.Index', description: 'Admin dashboard', auth: 'Authorize(Roles=Admin)', returns: 'View(DashboardViewModel)', controller: 'Admin' },
            { method: 'GET', route: '/Admin/Products', action: 'Products.Index', description: 'Product management', auth: 'Authorize(Roles=Admin)', returns: 'View(PagedList<Product>)', controller: 'Admin' },
            { method: 'GET', route: '/Admin/Products/Create', action: 'Products.Create', description: 'New product form', auth: 'Authorize(Roles=Admin)', returns: 'View()', controller: 'Admin' },
            { method: 'POST', route: '/Admin/Products/Create', action: 'Products.Create', description: 'Save + upload images', auth: 'Authorize(Roles=Admin)', returns: 'RedirectToAction("Index")', controller: 'Admin' },
            { method: 'POST', route: '/Admin/Products/UploadImage', action: 'Products.UploadImage', description: 'AJAX image upload', auth: 'Authorize(Roles=Admin)', returns: 'Json({ url })', controller: 'Admin' },
            { method: 'GET', route: '/Admin/Products/Edit/{id}', action: 'Products.Edit', description: 'Edit form', auth: 'Authorize(Roles=Admin)', returns: 'View(Product)', controller: 'Admin' },
            { method: 'POST', route: '/Admin/Products/Edit/{id}', action: 'Products.Edit', description: 'Update product', auth: 'Authorize(Roles=Admin)', returns: 'RedirectToAction("Index")', controller: 'Admin' },
            { method: 'DELETE', route: '/Admin/Products/{id}', action: 'Products.Delete', description: 'Delete (AJAX)', auth: 'Authorize(Roles=Admin)', returns: 'Json({ success })', controller: 'Admin' },
            { method: 'GET', route: '/Admin/Orders', action: 'Orders.Index', description: 'Order management', auth: 'Authorize(Roles=Admin)', returns: 'View(List<Order>)', controller: 'Admin' },
            { method: 'POST', route: '/Admin/Orders/{id}/Status', action: 'Orders.UpdateStatus', description: 'Change status', auth: 'Authorize(Roles=Admin)', returns: 'Json({ status })', controller: 'Admin' },
            { method: 'GET', route: '/Admin/Categories', action: 'Categories.Index', description: 'Category CRUD', auth: 'Authorize(Roles=Admin)', returns: 'View(List<Category>)', controller: 'Admin' },
            { method: 'GET', route: '/Admin/Reports/Sales', action: 'Reports.Sales', description: 'Sales report + charts', auth: 'Authorize(Roles=Admin)', returns: 'View(SalesReportViewModel)', controller: 'Admin' },
        ],
        dbTables: [
            { name: 'AspNetUsers', columns: 14, description: 'Extended with Address, City, ZipCode' },
            { name: 'Products', columns: 12, description: 'Name, Price, Stock, CategoryId, Images' },
            { name: 'Categories', columns: 4, description: 'Name, Slug, ParentId, SortOrder' },
            { name: 'Orders', columns: 11, description: 'UserId, Total, Status, ShippingAddress' },
            { name: 'OrderItems', columns: 6, description: 'OrderId, ProductId, Quantity, UnitPrice' },
            { name: 'CartItems', columns: 5, description: 'SessionId, ProductId, Quantity' },
            { name: 'Reviews', columns: 6, description: 'ProductId, UserId, Rating, Comment' },
            { name: 'ProductImages', columns: 4, description: 'ProductId, Url, IsMain' },
        ],
        projectTree: `ShopFlow/
├── Areas/
│   ├── Admin/
│   │   ├── Controllers/
│   │   ├── Views/
│   │   └── AdminAreaRegistration.cs
│   └── Customer/
├── Controllers/
│   ├── HomeController.cs
│   ├── ProductsController.cs
│   ├── CartController.cs
│   ├── CheckoutController.cs
│   ├── OrdersController.cs
│   └── ReviewsController.cs
├── Models/
│   ├── Product.cs
│   ├── Category.cs
│   ├── Order.cs
│   ├── OrderItem.cs
│   ├── CartItem.cs
│   └── Review.cs
├── Services/
│   ├── ICartService.cs
│   ├── CartService.cs
│   ├── IPaymentService.cs
│   └── StripePaymentService.cs
├── ViewComponents/
│   ├── CartBadgeViewComponent.cs
│   └── CategoryNavViewComponent.cs
├── Filters/
│   └── AdminOnlyAttribute.cs
├── Data/
│   └── AppDbContext.cs
├── wwwroot/images/products/
└── Program.cs`,
        identityConfig: `builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 8;
    options.Password.RequireDigit = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.SignIn.RequireConfirmedEmail = true;
    options.Lockout.MaxFailedAccessAttempts = 3;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();`,
    },
    {
        id: 'eduportal',
        name: 'EduPortal MVC',
        tagline: 'Student & course management',
        description: 'Education portal with three role-based areas (Admin, Instructor, Student), a quiz engine with auto-grading, and PDF certificate generation via QuestPDF.',
        icon: '🎓',
        color: '#34c759',
        techStack: ['ASP.NET Core MVC', 'EF Core', 'Identity', 'SQL Server', 'QuestPDF', 'ClosedXML'],
        features: [
            'Multi-role areas: Admin, Instructor, Student',
            'Course catalog + enrollment',
            'Video lessons with progress tracking',
            'Quiz engine with auto-grading',
            'Assignment submissions + feedback',
            'PDF certificate generation (QuestPDF)',
            'Excel export for reports',
            'Background worker for notifications',
        ],
        packages: [
            { name: 'Microsoft.EntityFrameworkCore.SqlServer', version: '9.0.0' },
            { name: 'Microsoft.AspNetCore.Identity.EntityFrameworkCore', version: '9.0.0' },
            { name: 'QuestPDF', version: '2024.12.0' },
            { name: 'ClosedXML', version: '0.104.0' },
        ],
        architecture: [
            { label: 'Services', desc: 'Enrollment, Quiz, Certificate', icon: '⚙️' },
            { label: 'Background', desc: 'Grade notifications worker', icon: '⏰' },
            { label: 'Generators', desc: 'PDF + Excel reports', icon: '📄' },
            { label: 'Areas', desc: 'Admin, Instructor, Student', icon: '📂' },
            { label: 'Validators', desc: 'FluentValidation for forms', icon: '✓' },
            { label: 'Helpers', desc: 'Video URL parsing', icon: '🛠' },
        ],
        stats: [
            { label: 'Controllers', value: '10', icon: '🎮' },
            { label: 'Endpoints', value: '32', icon: '🔌' },
            { label: 'Entities', value: '10', icon: '📊' },
            { label: 'Areas', value: '3', icon: '📂' },
        ],
        endpoints: [
            { method: 'GET', route: '/', action: 'Home.Index', description: 'Featured courses', auth: 'Anonymous', returns: 'View(List<Course>)', controller: 'Home' },
            { method: 'GET', route: '/Courses', action: 'Courses.Index', description: 'All courses + filters', auth: 'Anonymous', returns: 'View(PagedList<Course>)', controller: 'Courses' },
            { method: 'GET', route: '/Courses/Details/{id}', action: 'Courses.Details', description: 'Course detail + curriculum', auth: 'Anonymous', returns: 'View(CourseDetailViewModel)', controller: 'Courses' },
            { method: 'POST', route: '/Courses/{id}/Enroll', action: 'Courses.Enroll', description: 'Enroll student', auth: 'Authorize(Student)', returns: 'RedirectToAction("Learn")', controller: 'Courses' },
            { method: 'GET', route: '/Courses/{id}/Learn', action: 'Courses.Learn', description: 'Player with progress', auth: 'Authorize(Enrolled)', returns: 'View(LearningViewModel)', controller: 'Courses' },
            { method: 'GET', route: '/Lessons/{id}', action: 'Lessons.View', description: 'Lesson viewer', auth: 'Authorize(Enrolled)', returns: 'View(Lesson)', controller: 'Lessons' },
            { method: 'POST', route: '/Lessons/{id}/Complete', action: 'Lessons.Complete', description: 'Mark complete (AJAX)', auth: 'Authorize(Enrolled)', returns: 'Json({ progress, hasCertificate })', controller: 'Lessons' },
            { method: 'GET', route: '/Quizzes/{id}', action: 'Quizzes.Take', description: 'Quiz form', auth: 'Authorize(Enrolled)', returns: 'View(Quiz)', controller: 'Quizzes' },
            { method: 'POST', route: '/Quizzes/{id}/Submit', action: 'Quizzes.Submit', description: 'Submit + auto-grade', auth: 'Authorize(Enrolled)', returns: 'RedirectToAction("Result")', controller: 'Quizzes' },
            { method: 'GET', route: '/Quizzes/{id}/Result', action: 'Quizzes.Result', description: 'Result + answer review', auth: 'Authorize(Enrolled)', returns: 'View(QuizResultViewModel)', controller: 'Quizzes' },
            { method: 'GET', route: '/Assignments', action: 'Assignments.Index', description: 'Student assignments', auth: 'Authorize(Student)', returns: 'View(List<Assignment>)', controller: 'Assignments' },
            { method: 'GET', route: '/Assignments/{id}/Submit', action: 'Assignments.Submit', description: 'Submission form', auth: 'Authorize(Student)', returns: 'View()', controller: 'Assignments' },
            { method: 'POST', route: '/Assignments/{id}/Submit', action: 'Assignments.Submit', description: 'Upload file', auth: 'Authorize(Student)', returns: 'RedirectToAction("Index")', controller: 'Assignments' },
            { method: 'GET', route: '/Certificates/{courseId}', action: 'Certificates.Generate', description: 'Generate PDF certificate', auth: 'Authorize(Completed)', returns: 'FileContentResult(pdf)', controller: 'Certificates' },
            { method: 'GET', route: '/Profile', action: 'Profile.Index', description: 'Profile + stats', auth: 'Authorize', returns: 'View(ProfileViewModel)', controller: 'Profile' },
            { method: 'POST', route: '/Profile/Update', action: 'Profile.Update', description: 'Update profile + avatar', auth: 'Authorize', returns: 'RedirectToAction("Index")', controller: 'Profile' },
            { method: 'GET', route: '/Instructor', action: 'Instructor.Index', description: 'Instructor dashboard', auth: 'Authorize(Roles=Instructor)', returns: 'View(DashboardViewModel)', controller: 'Instructor' },
            { method: 'GET', route: '/Instructor/Courses', action: 'Instructor.Courses', description: 'Owned courses', auth: 'Authorize(Roles=Instructor)', returns: 'View(List<Course>)', controller: 'Instructor' },
            { method: 'GET', route: '/Instructor/Courses/Create', action: 'Instructor.Create', description: 'New course wizard', auth: 'Authorize(Roles=Instructor)', returns: 'View()', controller: 'Instructor' },
            { method: 'POST', route: '/Instructor/Courses/Create', action: 'Instructor.Create', description: 'Save + cover', auth: 'Authorize(Roles=Instructor)', returns: 'RedirectToAction("Edit")', controller: 'Instructor' },
            { method: 'POST', route: '/Instructor/Courses/{id}/Submit', action: 'Instructor.Submit', description: 'Submit for review', auth: 'Authorize(Instructor)', returns: 'Json({ status })', controller: 'Instructor' },
            { method: 'GET', route: '/Instructor/Courses/{id}/Lessons', action: 'Lessons.Manage', description: 'Manage lessons', auth: 'Authorize(Instructor)', returns: 'View(Course) | Forbid()', controller: 'Instructor' },
            { method: 'POST', route: '/Instructor/Lessons/Create', action: 'Lessons.Create', description: 'Add lesson', auth: 'Authorize(Instructor)', returns: 'RedirectToAction("Manage")', controller: 'Instructor' },
            { method: 'POST', route: '/Instructor/Lessons/Reorder', action: 'Lessons.Reorder', description: 'Drag-drop reorder', auth: 'Authorize(Instructor)', returns: 'Json({ success })', controller: 'Instructor' },
            { method: 'GET', route: '/Instructor/Grading', action: 'Grading.Index', description: 'Pending submissions', auth: 'Authorize(Instructor)', returns: 'View(List<Submission>)', controller: 'Instructor' },
            { method: 'POST', route: '/Instructor/Grading/{submissionId}', action: 'Grading.Grade', description: 'Grade + feedback', auth: 'Authorize(Instructor)', returns: 'RedirectToAction("Index")', controller: 'Instructor' },
            { method: 'GET', route: '/Admin', action: 'AdminDashboard.Index', description: 'Platform stats', auth: 'Authorize(Roles=Admin)', returns: 'View(AdminDashboard)', controller: 'Admin' },
            { method: 'GET', route: '/Admin/Courses', action: 'AdminCourses.Index', description: 'Course moderation', auth: 'Authorize(Roles=Admin)', returns: 'View(PagedList<Course>)', controller: 'Admin' },
            { method: 'POST', route: '/Admin/Courses/{id}/Approve', action: 'AdminCourses.Approve', description: 'Approve course', auth: 'Authorize(Roles=Admin)', returns: 'Json({ success })', controller: 'Admin' },
            { method: 'GET', route: '/Admin/Users', action: 'AdminUsers.Index', description: 'User management', auth: 'Authorize(Roles=Admin)', returns: 'View(List<UserWithRoles>)', controller: 'Admin' },
            { method: 'POST', route: '/Admin/Users/{id}/Role', action: 'AdminUsers.ChangeRole', description: 'Change role', auth: 'Authorize(Roles=Admin)', returns: 'Json({ success })', controller: 'Admin' },
            { method: 'GET', route: '/Admin/Reports/Export', action: 'Reports.Export', description: 'Export to Excel', auth: 'Authorize(Roles=Admin)', returns: 'FileContentResult(xlsx)', controller: 'Admin' },
        ],
        dbTables: [
            { name: 'AspNetUsers', columns: 15, description: 'Extended with AvatarPath, Bio, JoinedAt' },
            { name: 'Courses', columns: 12, description: 'Title, CoverImage, InstructorId, Status, Price' },
            { name: 'Lessons', columns: 10, description: 'CourseId, VideoUrl, Content, OrderIndex, Duration' },
            { name: 'Enrollments', columns: 5, description: 'StudentId, CourseId, Progress, EnrolledAt' },
            { name: 'LessonProgress', columns: 5, description: 'EnrollmentId, LessonId, CompletedAt, WatchTime' },
            { name: 'Quizzes', columns: 6, description: 'LessonId, Title, PassingScore, TimeLimit' },
            { name: 'QuizQuestions', columns: 5, description: 'QuizId, QuestionText, Options, CorrectAnswer' },
            { name: 'QuizAttempts', columns: 6, description: 'StudentId, QuizId, Score, Answers' },
            { name: 'Assignments', columns: 8, description: 'CourseId, Title, DueDate, MaxScore' },
            { name: 'Submissions', columns: 7, description: 'AssignmentId, StudentId, FilePath, Grade' },
        ],
        projectTree: `EduPortal/
├── Areas/
│   ├── Admin/
│   ├── Instructor/
│   └── Student/
├── Controllers/
│   ├── HomeController.cs
│   ├── CoursesController.cs
│   ├── LessonsController.cs
│   ├── QuizzesController.cs
│   ├── AssignmentsController.cs
│   ├── CertificatesController.cs
│   └── ProfileController.cs
├── Models/
│   ├── ApplicationUser.cs
│   ├── Course.cs
│   ├── Lesson.cs
│   ├── Enrollment.cs
│   ├── LessonProgress.cs
│   ├── Quiz.cs
│   ├── QuizQuestion.cs
│   ├── QuizAttempt.cs
│   ├── Assignment.cs
│   └── Submission.cs
├── ViewModels/
│   ├── CourseDetailViewModel.cs
│   ├── LearningViewModel.cs
│   └── QuizResultViewModel.cs
├── Services/
│   ├── IEnrollmentService.cs
│   ├── IQuizService.cs
│   └── QuestPdfCertificateService.cs
├── BackgroundServices/
│   └── GradeNotificationWorker.cs
└── Program.cs`,
        identityConfig: `builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 8;
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.SignIn.RequireConfirmedEmail = true;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();`,
    },
    {
        id: 'devblog',
        name: 'DevBlog MVC',
        tagline: 'Developer blogging platform',
        description: 'Blogging platform tailored for developers with Markdown authoring, syntax highlighting, threaded comments with moderation, tags, and RSS/Atom feeds.',
        icon: '✍️',
        color: '#ff9500',
        techStack: ['ASP.NET Core MVC', 'EF Core', 'Identity', 'SQL Server', 'Markdig', 'Prism.js'],
        features: [
            'Markdown editor with live preview',
            'Syntax highlighting (20+ languages)',
            'Threaded comments + moderation queue',
            'Tag system with usage counters',
            'RSS/Atom feed generation',
            'Reading time estimation',
            'Post edit history + revisions',
            'Author profiles',
        ],
        packages: [
            { name: 'Microsoft.EntityFrameworkCore.SqlServer', version: '9.0.0' },
            { name: 'Microsoft.AspNetCore.Identity.EntityFrameworkCore', version: '9.0.0' },
            { name: 'Markdig', version: '0.37.0' },
            { name: 'HtmlSanitizer', version: '8.1.870' },
        ],
        architecture: [
            { label: 'Markdown', desc: 'Markdig pipeline + sanitization', icon: '📝' },
            { label: 'Comments', desc: 'Threaded tree structure', icon: '💬' },
            { label: 'Tags', desc: 'Many-to-many with counters', icon: '🏷' },
            { label: 'Feeds', desc: 'RSS/Atom XML generation', icon: '📡' },
            { label: 'Search', desc: 'Full-text + ranking', icon: '🔍' },
            { label: 'Moderation', desc: 'Comment approval workflow', icon: '🛡' },
        ],
        stats: [
            { label: 'Controllers', value: '7', icon: '🎮' },
            { label: 'Endpoints', value: '23', icon: '🔌' },
            { label: 'Entities', value: '7', icon: '📊' },
            { label: 'Roles', value: '3', icon: '🛡' },
        ],
        endpoints: [
            { method: 'GET', route: '/', action: 'Home.Index', description: 'Latest + featured posts', auth: 'Anonymous', returns: 'View(HomeViewModel)', controller: 'Home' },
            { method: 'GET', route: '/Posts', action: 'Posts.Index', description: 'All published posts', auth: 'Anonymous', returns: 'View(PagedList<Post>)', controller: 'Posts' },
            { method: 'GET', route: '/Posts/{slug}', action: 'Posts.Details', description: 'Post detail with rendered markdown', auth: 'Anonymous', returns: 'View(Post) | NotFound()', controller: 'Posts' },
            { method: 'GET', route: '/Posts/Tag/{tag}', action: 'Posts.ByTag', description: 'Posts by tag', auth: 'Anonymous', returns: 'View(List<Post>)', controller: 'Posts' },
            { method: 'GET', route: '/Posts/Search', action: 'Posts.Search', description: 'Full-text search', auth: 'Anonymous', returns: 'View(SearchResults)', controller: 'Posts' },
            { method: 'POST', route: '/Posts/{id}/Like', action: 'Posts.Like', description: 'Like/unlike (AJAX)', auth: 'Authorize', returns: 'Json({ likes, liked })', controller: 'Posts' },
            { method: 'GET', route: '/Posts/Create', action: 'Posts.Create', description: 'Editor with preview', auth: 'Authorize(Roles=Author)', returns: 'View()', controller: 'Posts' },
            { method: 'POST', route: '/Posts/Create', action: 'Posts.Create', description: 'Save draft or publish', auth: 'Authorize(Roles=Author)', returns: 'RedirectToAction("Details")', controller: 'Posts' },
            { method: 'POST', route: '/Posts/Preview', action: 'Posts.Preview', description: 'Server-side markdown preview', auth: 'Authorize', returns: 'Json({ html })', controller: 'Posts' },
            { method: 'GET', route: '/Posts/Edit/{id}', action: 'Posts.Edit', description: 'Edit post', auth: 'Authorize(Owner)', returns: 'View(Post) | Forbid()', controller: 'Posts' },
            { method: 'POST', route: '/Posts/Edit/{id}', action: 'Posts.Edit', description: 'Update + revision', auth: 'Authorize(Owner)', returns: 'RedirectToAction("Details")', controller: 'Posts' },
            { method: 'DELETE', route: '/Posts/{id}', action: 'Posts.Delete', description: 'Soft delete', auth: 'Authorize(Owner)', returns: 'Json({ success })', controller: 'Posts' },
            { method: 'POST', route: '/Comments/Create', action: 'Comments.Create', description: 'New comment', auth: 'Authorize', returns: 'RedirectToAction("Details","Posts")', controller: 'Comments' },
            { method: 'POST', route: '/Comments/{id}/Reply', action: 'Comments.Reply', description: 'Reply (threaded)', auth: 'Authorize', returns: 'Json({ comment })', controller: 'Comments' },
            { method: 'POST', route: '/Comments/{id}/Like', action: 'Comments.Like', description: 'Like comment', auth: 'Authorize', returns: 'Json({ likes })', controller: 'Comments' },
            { method: 'DELETE', route: '/Comments/{id}', action: 'Comments.Delete', description: 'Delete own comment', auth: 'Authorize(Owner)', returns: 'Json({ success })', controller: 'Comments' },
            { method: 'GET', route: '/Tags', action: 'Tags.Index', description: 'Tag cloud', auth: 'Anonymous', returns: 'View(List<Tag>)', controller: 'Tags' },
            { method: 'GET', route: '/Authors/{username}', action: 'Authors.Profile', description: 'Author profile + posts', auth: 'Anonymous', returns: 'View(AuthorProfileViewModel)', controller: 'Authors' },
            { method: 'GET', route: '/Feed/Rss', action: 'Feed.Rss', description: 'RSS 2.0 feed', auth: 'Anonymous', returns: 'ContentResult(xml)', controller: 'Feed' },
            { method: 'GET', route: '/Feed/Atom', action: 'Feed.Atom', description: 'Atom feed', auth: 'Anonymous', returns: 'ContentResult(xml)', controller: 'Feed' },
            { method: 'GET', route: '/Admin/Moderation', action: 'Moderation.Index', description: 'Comment queue', auth: 'Authorize(Roles=Admin)', returns: 'View(List<Comment>)', controller: 'Admin' },
            { method: 'POST', route: '/Admin/Moderation/{id}/Approve', action: 'Moderation.Approve', description: 'Approve comment', auth: 'Authorize(Roles=Admin)', returns: 'Json({ success })', controller: 'Admin' },
            { method: 'POST', route: '/Admin/Moderation/{id}/Reject', action: 'Moderation.Reject', description: 'Reject comment', auth: 'Authorize(Roles=Admin)', returns: 'Json({ success })', controller: 'Admin' },
        ],
        dbTables: [
            { name: 'AspNetUsers', columns: 13, description: 'Extended with Username, Bio, AvatarPath, Twitter' },
            { name: 'Posts', columns: 14, description: 'Slug, Title, MarkdownContent, RenderedHtml, Status' },
            { name: 'Tags', columns: 5, description: 'Name, Slug, PostCount' },
            { name: 'PostTags', columns: 2, description: 'PostId, TagId (many-to-many)' },
            { name: 'Comments', columns: 10, description: 'PostId, UserId, ParentCommentId, Approved' },
            { name: 'Reactions', columns: 4, description: 'UserId, PostId, Type' },
            { name: 'PostRevisions', columns: 5, description: 'PostId, Content, EditedAt, EditedBy' },
        ],
        projectTree: `DevBlog/
├── Controllers/
│   ├── HomeController.cs
│   ├── PostsController.cs
│   ├── CommentsController.cs
│   ├── TagsController.cs
│   ├── AuthorsController.cs
│   ├── FeedController.cs
│   └── ModerationController.cs
├── Models/
│   ├── ApplicationUser.cs
│   ├── Post.cs
│   ├── Tag.cs
│   ├── PostTag.cs
│   ├── Comment.cs
│   ├── Reaction.cs
│   └── PostRevision.cs
├── Services/
│   ├── IMarkdownService.cs
│   ├── MarkdigMarkdownService.cs
│   ├── IFeedService.cs
│   └── RssFeedService.cs
├── ViewModels/
│   ├── PostEditorViewModel.cs
│   ├── AuthorProfileViewModel.cs
│   └── SearchResultsViewModel.cs
└── Program.cs`,
        identityConfig: `builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 8;
    options.SignIn.RequireConfirmedEmail = false;
    options.User.RequireUniqueEmail = true;
    options.Lockout.MaxFailedAccessAttempts = 5;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();`,
    },
    {
        id: 'meditrack',
        name: 'MediTrack MVC',
        tagline: 'Clinic appointment system',
        description: 'Multi-role healthcare platform with doctor scheduling, patient booking, digital prescriptions, SMS reminders via Twilio, and full audit logging.',
        icon: '🏥',
        color: '#ff3b30',
        techStack: ['ASP.NET Core MVC', 'EF Core', 'Identity', 'SQL Server', 'Twilio', 'QuestPDF'],
        features: [
            '4 roles: Admin, Doctor, Patient, Receptionist',
            'Doctor availability calendar',
            'Patient appointment booking + reschedule',
            'Prescription creation + digital signing',
            'Medical records with audit logs',
            'SMS reminders via Twilio',
            'PDF prescription generation',
            'Reception check-in workflow',
        ],
        packages: [
            { name: 'Microsoft.EntityFrameworkCore.SqlServer', version: '9.0.0' },
            { name: 'Microsoft.AspNetCore.Identity.EntityFrameworkCore', version: '9.0.0' },
            { name: 'Twilio', version: '7.5.0' },
            { name: 'QuestPDF', version: '2024.12.0' },
        ],
        architecture: [
            { label: 'Scheduling', desc: 'Slot generation + conflicts', icon: '📅' },
            { label: 'Notifications', desc: 'SMS + email worker', icon: '📱' },
            { label: 'Records', desc: 'Encrypted PII storage', icon: '🔐' },
            { label: 'Prescriptions', desc: 'Signing + PDF export', icon: '💊' },
            { label: 'Audit', desc: 'Every record access logged', icon: '📋' },
            { label: 'Reports', desc: 'Daily + monthly PDFs', icon: '📊' },
        ],
        stats: [
            { label: 'Controllers', value: '9', icon: '🎮' },
            { label: 'Endpoints', value: '26', icon: '🔌' },
            { label: 'Entities', value: '8', icon: '📊' },
            { label: 'Roles', value: '4', icon: '🛡' },
        ],
        endpoints: [
            { method: 'GET', route: '/', action: 'Home.Index', description: 'Landing + departments', auth: 'Anonymous', returns: 'View()', controller: 'Home' },
            { method: 'GET', route: '/Doctors', action: 'Doctors.Index', description: 'Browse by specialty', auth: 'Anonymous', returns: 'View(List<Doctor>)', controller: 'Doctors' },
            { method: 'GET', route: '/Doctors/{id}', action: 'Doctors.Profile', description: 'Doctor profile + reviews', auth: 'Anonymous', returns: 'View(DoctorProfile)', controller: 'Doctors' },
            { method: 'GET', route: '/Doctors/{id}/Availability', action: 'Doctors.Availability', description: 'Available slots (AJAX)', auth: 'Anonymous', returns: 'Json(List<Slot>)', controller: 'Doctors' },
            { method: 'GET', route: '/Appointments/Book/{doctorId}', action: 'Appointments.Book', description: 'Booking with calendar', auth: 'Authorize(Patient)', returns: 'View(BookingViewModel)', controller: 'Appointments' },
            { method: 'POST', route: '/Appointments/Book', action: 'Appointments.Book', description: 'Create + SMS confirm', auth: 'Authorize(Patient)', returns: 'RedirectToAction("Confirmation")', controller: 'Appointments' },
            { method: 'GET', route: '/Appointments/Confirmation/{id}', action: 'Appointments.Confirmation', description: 'Booking confirmation', auth: 'Authorize(Patient)', returns: 'View(Appointment)', controller: 'Appointments' },
            { method: 'GET', route: '/Appointments/My', action: 'Appointments.My', description: 'My appointments', auth: 'Authorize(Patient)', returns: 'View(MyAppointmentsViewModel)', controller: 'Appointments' },
            { method: 'POST', route: '/Appointments/{id}/Cancel', action: 'Appointments.Cancel', description: 'Cancel appointment', auth: 'Authorize(Patient)', returns: 'RedirectToAction("My")', controller: 'Appointments' },
            { method: 'GET', route: '/Appointments/{id}/Reschedule', action: 'Appointments.Reschedule', description: 'Reschedule form', auth: 'Authorize(Patient)', returns: 'View()', controller: 'Appointments' },
            { method: 'POST', route: '/Appointments/{id}/Reschedule', action: 'Appointments.Reschedule', description: 'Confirm reschedule', auth: 'Authorize(Patient)', returns: 'RedirectToAction("My")', controller: 'Appointments' },
            { method: 'GET', route: '/Doctor/Schedule', action: 'Doctor.Schedule', description: 'Weekly schedule', auth: 'Authorize(Roles=Doctor)', returns: 'View(ScheduleViewModel)', controller: 'Doctor' },
            { method: 'POST', route: '/Doctor/Availability', action: 'Doctor.SetAvailability', description: 'Set recurring slots', auth: 'Authorize(Roles=Doctor)', returns: 'Json({ success })', controller: 'Doctor' },
            { method: 'GET', route: '/Doctor/Patients', action: 'Doctor.Patients', description: 'Patient list', auth: 'Authorize(Roles=Doctor)', returns: 'View(List<Patient>)', controller: 'Doctor' },
            { method: 'GET', route: '/Doctor/Patients/{id}', action: 'Doctor.PatientDetail', description: 'Full record (audited)', auth: 'Authorize(Roles=Doctor)', returns: 'View(PatientDetail)', controller: 'Doctor' },
            { method: 'GET', route: '/Prescriptions/Create/{appointmentId}', action: 'Prescriptions.Create', description: 'New prescription', auth: 'Authorize(Roles=Doctor)', returns: 'View()', controller: 'Prescriptions' },
            { method: 'POST', route: '/Prescriptions/Create', action: 'Prescriptions.Create', description: 'Save + PDF + send', auth: 'Authorize(Roles=Doctor)', returns: 'RedirectToAction("Details")', controller: 'Prescriptions' },
            { method: 'GET', route: '/Prescriptions/{id}', action: 'Prescriptions.Details', description: 'View prescription', auth: 'Authorize(Patient|Doctor)', returns: 'View(Prescription)', controller: 'Prescriptions' },
            { method: 'GET', route: '/Prescriptions/{id}/Download', action: 'Prescriptions.Download', description: 'PDF download', auth: 'Authorize(Patient|Doctor)', returns: 'FileContentResult(pdf)', controller: 'Prescriptions' },
            { method: 'GET', route: '/Records/My', action: 'Records.My', description: 'Medical records', auth: 'Authorize(Patient)', returns: 'View(List<MedicalRecord>)', controller: 'Records' },
            { method: 'GET', route: '/Reception', action: 'Reception.Index', description: 'Today check-ins', auth: 'Authorize(Roles=Receptionist)', returns: 'View(TodayViewModel)', controller: 'Reception' },
            { method: 'POST', route: '/Reception/{id}/CheckIn', action: 'Reception.CheckIn', description: 'Check patient in', auth: 'Authorize(Roles=Receptionist)', returns: 'Json({ success })', controller: 'Reception' },
            { method: 'POST', route: '/Reception/{id}/NoShow', action: 'Reception.NoShow', description: 'Mark no-show', auth: 'Authorize(Roles=Receptionist)', returns: 'Json({ success })', controller: 'Reception' },
            { method: 'GET', route: '/Admin', action: 'Admin.Index', description: 'Clinic KPIs', auth: 'Authorize(Roles=Admin)', returns: 'View(DashboardViewModel)', controller: 'Admin' },
            { method: 'GET', route: '/Admin/Users', action: 'Admin.Users', description: 'Staff + patient management', auth: 'Authorize(Roles=Admin)', returns: 'View(List<UserWithRole>)', controller: 'Admin' },
            { method: 'GET', route: '/Admin/Reports', action: 'Admin.Reports', description: 'Monthly PDF reports', auth: 'Authorize(Roles=Admin)', returns: 'View(ReportsViewModel)', controller: 'Admin' },
        ],
        dbTables: [
            { name: 'AspNetUsers', columns: 17, description: 'Extended with DateOfBirth, BloodType, EmergencyContact' },
            { name: 'Doctors', columns: 9, description: 'UserId, Specialty, LicenseNumber, Bio, ConsultationFee' },
            { name: 'Patients', columns: 8, description: 'UserId, InsuranceNumber, Allergies, MedicalHistory' },
            { name: 'Appointments', columns: 10, description: 'DoctorId, PatientId, ScheduledAt, Status, Notes' },
            { name: 'Availability', columns: 6, description: 'DoctorId, DayOfWeek, StartTime, EndTime, SlotDuration' },
            { name: 'Prescriptions', columns: 9, description: 'AppointmentId, Medications, Instructions, SignedAt' },
            { name: 'MedicalRecords', columns: 8, description: 'PatientId, DoctorId, Diagnosis, Treatment' },
            { name: 'AuditLogs', columns: 6, description: 'UserId, RecordType, RecordId, Action, Timestamp, IP' },
        ],
        projectTree: `MediTrack/
├── Controllers/
│   ├── HomeController.cs
│   ├── DoctorsController.cs
│   ├── AppointmentsController.cs
│   ├── DoctorController.cs
│   ├── PrescriptionsController.cs
│   ├── RecordsController.cs
│   ├── ReceptionController.cs
│   └── AdminController.cs
├── Models/
│   ├── ApplicationUser.cs
│   ├── Doctor.cs
│   ├── Patient.cs
│   ├── Appointment.cs
│   ├── Availability.cs
│   ├── Prescription.cs
│   ├── MedicalRecord.cs
│   └── AuditLog.cs
├── Services/
│   ├── ISchedulingService.cs
│   ├── SchedulingService.cs
│   ├── ISmsService.cs
│   ├── TwilioSmsService.cs
│   └── IAuditService.cs
├── BackgroundServices/
│   └── AppointmentReminderWorker.cs
├── Pdf/
│   └── PrescriptionDocument.cs
└── Program.cs`,
        identityConfig: `builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 10;
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.SignIn.RequireConfirmedEmail = true;
    options.Lockout.MaxFailedAccessAttempts = 3;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(30);
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();`,
    },
    {
        id: 'inventorypro',
        name: 'InventoryPro MVC',
        tagline: 'Warehouse & inventory',
        description: 'Enterprise inventory management with multi-warehouse support, stock movement audit trail, low-stock alerts, purchase order workflow, and barcode integration.',
        icon: '📦',
        color: '#5856d6',
        techStack: ['ASP.NET Core MVC', 'EF Core', 'Identity', 'SQL Server', 'ZXing.Net', 'ClosedXML'],
        features: [
            'Multi-warehouse stock tracking',
            'Stock movement audit trail',
            'Low-stock alerts with thresholds',
            'Supplier + purchase order workflow',
            'Barcode generation + scanning',
            'Excel bulk import/export',
            'Stock valuation (FIFO/LIFO/Avg)',
            'Role-based approval chain',
        ],
        packages: [
            { name: 'Microsoft.EntityFrameworkCore.SqlServer', version: '9.0.0' },
            { name: 'Microsoft.AspNetCore.Identity.EntityFrameworkCore', version: '9.0.0' },
            { name: 'ZXing.Net.Bindings.ImageSharp', version: '0.16.14' },
            { name: 'ClosedXML', version: '0.104.0' },
        ],
        architecture: [
            { label: 'StockEngine', desc: 'Weighted avg + FIFO valuation', icon: '⚖️' },
            { label: 'Barcode', desc: 'EAN-13 + Code128 generation', icon: '📊' },
            { label: 'Workflow', desc: 'PO approval chain', icon: '✅' },
            { label: 'Audit', desc: 'Every quantity change logged', icon: '📋' },
            { label: 'Import', desc: 'Excel template parsing', icon: '📥' },
            { label: 'Reports', desc: 'PDF + Excel + CSV', icon: '📄' },
        ],
        stats: [
            { label: 'Controllers', value: '9', icon: '🎮' },
            { label: 'Endpoints', value: '30', icon: '🔌' },
            { label: 'Entities', value: '9', icon: '📊' },
            { label: 'Warehouses', value: '∞', icon: '🏭' },
        ],
        endpoints: [
            { method: 'GET', route: '/', action: 'Dashboard.Index', description: 'KPI dashboard', auth: 'Authorize', returns: 'View(DashboardViewModel)', controller: 'Dashboard' },
            { method: 'GET', route: '/Products', action: 'Products.Index', description: 'Product catalog + stock', auth: 'Authorize', returns: 'View(PagedList<Product>)', controller: 'Products' },
            { method: 'GET', route: '/Products/Create', action: 'Products.Create', description: 'New product form', auth: 'Authorize(Manager)', returns: 'View()', controller: 'Products' },
            { method: 'POST', route: '/Products/Create', action: 'Products.Create', description: 'Save + generate barcode', auth: 'Authorize(Manager)', returns: 'RedirectToAction("Details")', controller: 'Products' },
            { method: 'GET', route: '/Products/{id}', action: 'Products.Details', description: 'Product + movements', auth: 'Authorize', returns: 'View(ProductDetail)', controller: 'Products' },
            { method: 'GET', route: '/Products/{id}/Barcode', action: 'Products.Barcode', description: 'Barcode image', auth: 'Authorize', returns: 'FileContentResult(png)', controller: 'Products' },
            { method: 'POST', route: '/Products/Scan', action: 'Products.Scan', description: 'Scan barcode (AJAX)', auth: 'Authorize', returns: 'Json(ProductDto)', controller: 'Products' },
            { method: 'DELETE', route: '/Products/{id}', action: 'Products.Delete', description: 'Delete product', auth: 'Authorize(Admin)', returns: 'Json({ success })', controller: 'Products' },
            { method: 'GET', route: '/Warehouses', action: 'Warehouses.Index', description: 'All warehouses', auth: 'Authorize', returns: 'View(List<Warehouse>)', controller: 'Warehouses' },
            { method: 'GET', route: '/Warehouses/{id}/Stock', action: 'Warehouses.Stock', description: 'Stock per warehouse', auth: 'Authorize', returns: 'View(StockViewModel)', controller: 'Warehouses' },
            { method: 'GET', route: '/StockMovements', action: 'StockMovements.Index', description: 'Movement history', auth: 'Authorize', returns: 'View(PagedList<StockMovement>)', controller: 'StockMovements' },
            { method: 'GET', route: '/StockMovements/In', action: 'StockMovements.In', description: 'Stock in form', auth: 'Authorize', returns: 'View()', controller: 'StockMovements' },
            { method: 'POST', route: '/StockMovements/In', action: 'StockMovements.In', description: 'Record stock in', auth: 'Authorize', returns: 'RedirectToAction("Index")', controller: 'StockMovements' },
            { method: 'GET', route: '/StockMovements/Out', action: 'StockMovements.Out', description: 'Stock out form', auth: 'Authorize', returns: 'View()', controller: 'StockMovements' },
            { method: 'POST', route: '/StockMovements/Out', action: 'StockMovements.Out', description: 'Record stock out + check', auth: 'Authorize', returns: 'RedirectToAction("Index")', controller: 'StockMovements' },
            { method: 'GET', route: '/StockMovements/Transfer', action: 'StockMovements.Transfer', description: 'Warehouse transfer', auth: 'Authorize', returns: 'View()', controller: 'StockMovements' },
            { method: 'POST', route: '/StockMovements/Transfer', action: 'StockMovements.Transfer', description: 'Move between warehouses', auth: 'Authorize', returns: 'RedirectToAction("Index")', controller: 'StockMovements' },
            { method: 'GET', route: '/Suppliers', action: 'Suppliers.Index', description: 'Supplier directory', auth: 'Authorize', returns: 'View(List<Supplier>)', controller: 'Suppliers' },
            { method: 'POST', route: '/Suppliers/Create', action: 'Suppliers.Create', description: 'Add supplier', auth: 'Authorize(Manager)', returns: 'Json({ supplier })', controller: 'Suppliers' },
            { method: 'GET', route: '/PurchaseOrders', action: 'PurchaseOrders.Index', description: 'All POs', auth: 'Authorize', returns: 'View(PagedList<PurchaseOrder>)', controller: 'PurchaseOrders' },
            { method: 'GET', route: '/PurchaseOrders/Create', action: 'PurchaseOrders.Create', description: 'New PO form', auth: 'Authorize', returns: 'View()', controller: 'PurchaseOrders' },
            { method: 'POST', route: '/PurchaseOrders/Create', action: 'PurchaseOrders.Create', description: 'Save PO as draft', auth: 'Authorize', returns: 'RedirectToAction("Details")', controller: 'PurchaseOrders' },
            { method: 'POST', route: '/PurchaseOrders/{id}/Submit', action: 'PurchaseOrders.Submit', description: 'Submit for approval', auth: 'Authorize', returns: 'Json({ status })', controller: 'PurchaseOrders' },
            { method: 'POST', route: '/PurchaseOrders/{id}/Approve', action: 'PurchaseOrders.Approve', description: 'Approve PO', auth: 'Authorize(Manager)', returns: 'Json({ status })', controller: 'PurchaseOrders' },
            { method: 'POST', route: '/PurchaseOrders/{id}/Receive', action: 'PurchaseOrders.Receive', description: 'Mark received + stock in', auth: 'Authorize', returns: 'RedirectToAction("Details")', controller: 'PurchaseOrders' },
            { method: 'GET', route: '/Alerts', action: 'Alerts.Index', description: 'Low-stock alerts', auth: 'Authorize', returns: 'View(List<Alert>)', controller: 'Alerts' },
            { method: 'POST', route: '/Alerts/{id}/Acknowledge', action: 'Alerts.Acknowledge', description: 'Resolve alert', auth: 'Authorize', returns: 'Json({ success })', controller: 'Alerts' },
            { method: 'GET', route: '/Reports/Valuation', action: 'Reports.Valuation', description: 'Stock valuation', auth: 'Authorize(Manager)', returns: 'View(ValuationViewModel)', controller: 'Reports' },
            { method: 'GET', route: '/Reports/Export', action: 'Reports.Export', description: 'Export to Excel', auth: 'Authorize(Manager)', returns: 'FileContentResult(xlsx)', controller: 'Reports' },
            { method: 'POST', route: '/Import/Products', action: 'Import.Products', description: 'Bulk import from Excel', auth: 'Authorize(Admin)', returns: 'Json({ imported, failed })', controller: 'Import' },
        ],
        dbTables: [
            { name: 'AspNetUsers', columns: 13, description: 'Extended with EmployeeCode, Department' },
            { name: 'Products', columns: 14, description: 'SKU, Name, Barcode, Cost, Price, MinStock, ReorderQty' },
            { name: 'Categories', columns: 5, description: 'Name, ParentId, SortOrder' },
            { name: 'Warehouses', columns: 7, description: 'Code, Name, Address, ManagerId' },
            { name: 'StockLevels', columns: 5, description: 'ProductId, WarehouseId, Quantity, ReservedQty' },
            { name: 'StockMovements', columns: 10, description: 'ProductId, WarehouseId, Type, Quantity, UserId' },
            { name: 'Suppliers', columns: 9, description: 'Name, ContactPerson, Email, Phone, PaymentTerms' },
            { name: 'PurchaseOrders', columns: 11, description: 'PONumber, SupplierId, Status, Total, CreatedBy' },
            { name: 'PurchaseOrderItems', columns: 6, description: 'POId, ProductId, Quantity, UnitCost' },
        ],
        projectTree: `InventoryPro/
├── Controllers/
│   ├── DashboardController.cs
│   ├── ProductsController.cs
│   ├── WarehousesController.cs
│   ├── StockMovementsController.cs
│   ├── SuppliersController.cs
│   ├── PurchaseOrdersController.cs
│   ├── AlertsController.cs
│   ├── ReportsController.cs
│   └── ImportController.cs
├── Models/
│   ├── ApplicationUser.cs
│   ├── Product.cs
│   ├── Category.cs
│   ├── Warehouse.cs
│   ├── StockLevel.cs
│   ├── StockMovement.cs
│   ├── Supplier.cs
│   ├── PurchaseOrder.cs
│   └── PurchaseOrderItem.cs
├── Services/
│   ├── IStockEngine.cs
│   ├── WeightedAvgStockEngine.cs
│   ├── IBarcodeService.cs
│   ├── ZXingBarcodeService.cs
│   ├── IImportService.cs
│   └── ExcelImportService.cs
├── Reports/
│   ├── ValuationReport.cs
│   └── MovementReport.cs
└── Program.cs`,
        identityConfig: `builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 8;
    options.Password.RequireDigit = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.SignIn.RequireConfirmedEmail = false;
    options.Lockout.MaxFailedAccessAttempts = 5;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();`,
    },
];