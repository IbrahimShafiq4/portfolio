export interface OsEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    route: string;
    action: string;
    description: string;
    auth: string;
    returns: string;
}

export interface OsController {
    id: string;
    name: string;
    feature: string;
    icon: string;
    color: string;
    description: string;
    endpoints: OsEndpoint[];
}

export const OMNISOCIAL_FEATURES = [
    { id: 'posts', label: 'Posts & Publishing', icon: '📝', color: '#007aff' },
    { id: 'feed', label: 'Feed & Discovery', icon: '📰', color: '#34c759' },
    { id: 'stories', label: 'Stories & Reels', icon: '📸', color: '#ff9500' },
    { id: 'live', label: 'Live Streams', icon: '📡', color: '#ff3b30' },
    { id: 'messages', label: 'Messages & Calls', icon: '💬', color: '#af52de' },
    { id: 'profiles', label: 'Profiles & Identity', icon: '👤', color: '#5856d6' },
    { id: 'social', label: 'Social Graph', icon: '🕸', color: '#ff2d55' },
    { id: 'bookmarks', label: 'Bookmarks & Collections', icon: '🔖', color: '#00c7be' },
    { id: 'analytics', label: 'Analytics & Insights', icon: '📊', color: '#ff9500' },
    { id: 'ai', label: 'AI & Smart Features', icon: '🤖', color: '#af52de' },
    { id: 'safety', label: 'Safety & Moderation', icon: '🛡', color: '#34c759' },
    { id: 'gamification', label: 'Gamification', icon: '🏆', color: '#ffcc00' },
    { id: 'music', label: 'Music & TikTok', icon: '🎵', color: '#ff2d55' },
    { id: 'misc', label: 'Misc Features', icon: '✨', color: '#8e8e93' },
];

export const OMNISOCIAL_CONTROLLERS: OsController[] = [
    {
        id: 'posts', name: 'PostsController', feature: 'posts', icon: '📝', color: '#007aff',
        description: 'Core post CRUD + multi-platform publishing',
        endpoints: [
            { method: 'GET', route: '/api/posts', action: 'GetAll', description: 'List posts with pagination', auth: 'Anonymous', returns: 'PagedResult<PostDto>' },
            { method: 'GET', route: '/api/posts/{id}', action: 'GetById', description: 'Post detail with comments', auth: 'Anonymous', returns: 'PostDetailDto' },
            { method: 'POST', route: '/api/posts', action: 'Create', description: 'Create multi-platform post', auth: 'Bearer', returns: 'PostDto' },
            { method: 'PUT', route: '/api/posts/{id}', action: 'Update', description: 'Update own post', auth: 'Bearer(Owner)', returns: 'PostDto' },
            { method: 'DELETE', route: '/api/posts/{id}', action: 'Delete', description: 'Soft delete post', auth: 'Bearer(Owner)', returns: 'NoContent' },
            { method: 'POST', route: '/api/posts/{id}/like', action: 'Like', description: 'Like post', auth: 'Bearer', returns: '{ likes, liked }' },
            { method: 'POST', route: '/api/posts/{id}/unlike', action: 'Unlike', description: 'Unlike post', auth: 'Bearer', returns: '{ likes }' },
            { method: 'POST', route: '/api/posts/{id}/bookmark', action: 'Bookmark', description: 'Save post', auth: 'Bearer', returns: '{ saved }' },
            { method: 'GET', route: '/api/posts/{id}/stats', action: 'GetStats', description: 'Engagement stats', auth: 'Bearer(Owner)', returns: 'PostStatsDto' },
        ],
    },
    {
        id: 'feed', name: 'FeedController', feature: 'feed', icon: '📰', color: '#34c759',
        description: 'Feed aggregation and filtering',
        endpoints: [
            { method: 'GET', route: '/api/feed', action: 'Get', description: 'Unified feed', auth: 'Bearer', returns: 'PagedResult<PostDto>' },
            { method: 'GET', route: '/api/feed/following', action: 'Following', description: 'Following-only feed', auth: 'Bearer', returns: 'PagedResult<PostDto>' },
            { method: 'GET', route: '/api/feed/trending', action: 'Trending', description: 'Trending algorithm', auth: 'Anonymous', returns: 'PagedResult<PostDto>' },
            { method: 'GET', route: '/api/feed/discover', action: 'Discover', description: 'Discovery algorithm', auth: 'Bearer', returns: 'PagedResult<PostDto>' },
            { method: 'GET', route: '/api/feed/platform/{name}', action: 'ByPlatform', description: 'Filter by Twitter/IG/TikTok', auth: 'Bearer', returns: 'PagedResult<PostDto>' },
        ],
    },
    {
        id: 'stories', name: 'StoriesController', feature: 'stories', icon: '📸', color: '#ff9500',
        description: 'Instagram-style ephemeral stories',
        endpoints: [
            { method: 'GET', route: '/api/stories', action: 'GetActive', description: 'Active stories', auth: 'Bearer', returns: 'List<StoryDto>' },
            { method: 'GET', route: '/api/stories/{id}', action: 'GetById', description: 'Story detail', auth: 'Bearer', returns: 'StoryDto' },
            { method: 'POST', route: '/api/stories', action: 'Create', description: 'Upload story + music', auth: 'Bearer', returns: 'StoryDto' },
            { method: 'DELETE', route: '/api/stories/{id}', action: 'Delete', description: 'Delete own story', auth: 'Bearer(Owner)', returns: 'NoContent' },
            { method: 'POST', route: '/api/stories/{id}/view', action: 'MarkViewed', description: 'Track viewer', auth: 'Bearer', returns: 'NoContent' },
            { method: 'GET', route: '/api/stories/{id}/viewers', action: 'Viewers', description: 'Who viewed (owner only)', auth: 'Bearer(Owner)', returns: 'List<UserDto>' },
        ],
    },
    {
        id: 'reels', name: 'ReelsController', feature: 'stories', icon: '🎬', color: '#ff9500',
        description: 'TikTok-style short videos',
        endpoints: [
            { method: 'GET', route: '/api/reels', action: 'Get', description: 'Reels feed', auth: 'Bearer', returns: 'PagedResult<ReelDto>' },
            { method: 'POST', route: '/api/reels', action: 'Create', description: 'Upload reel', auth: 'Bearer', returns: 'ReelDto' },
            { method: 'POST', route: '/api/reels/{id}/like', action: 'Like', description: 'Like reel', auth: 'Bearer', returns: '{ likes }' },
        ],
    },
    {
        id: 'live', name: 'LiveStreamsController', feature: 'live', icon: '📡', color: '#ff3b30',
        description: 'Live streaming + studio',
        endpoints: [
            { method: 'GET', route: '/api/livestreams', action: 'GetAll', description: 'All streams', auth: 'Bearer', returns: 'List<LiveDto>' },
            { method: 'GET', route: '/api/livestreams/active', action: 'GetActive', description: 'Currently live', auth: 'Anonymous', returns: 'List<LiveDto>' },
            { method: 'GET', route: '/api/livestreams/{id}', action: 'GetById', description: 'Stream detail', auth: 'Bearer', returns: 'LiveDto' },
            { method: 'POST', route: '/api/livestreams', action: 'Create', description: 'Create stream', auth: 'Bearer', returns: 'LiveDto' },
            { method: 'POST', route: '/api/livestreams/{id}/start', action: 'Start', description: 'Go live', auth: 'Bearer(Owner)', returns: 'LiveDto' },
            { method: 'POST', route: '/api/livestreams/{id}/join', action: 'Join', description: 'Join as viewer (WebRTC)', auth: 'Bearer', returns: 'IceServers' },
            { method: 'POST', route: '/api/livestreams/{id}/leave', action: 'Leave', description: 'Leave', auth: 'Bearer', returns: 'NoContent' },
            { method: 'POST', route: '/api/livestreams/{id}/end', action: 'End', description: 'End stream', auth: 'Bearer(Owner)', returns: 'LiveDto' },
            { method: 'GET', route: '/api/livestreams/{id}/chat', action: 'GetChat', description: 'Live chat', auth: 'Bearer', returns: 'List<ChatMessage>' },
            { method: 'POST', route: '/api/livestreams/{id}/chat', action: 'SendChat', description: 'Send message', auth: 'Bearer', returns: 'ChatMessage' },
        ],
    },
    {
        id: 'live-studio', name: 'LiveStudioController', feature: 'live', icon: '🎨', color: '#ff3b30',
        description: 'Drawing, emojis, filters overlay',
        endpoints: [
            { method: 'POST', route: '/api/livestudio/{id}/overlay', action: 'AddOverlay', description: 'Add drawing/emoji/filter', auth: 'Bearer', returns: 'OverlayDto' },
            { method: 'GET', route: '/api/livestudio/{id}/overlays', action: 'GetOverlays', description: 'All active overlays', auth: 'Bearer', returns: 'List<OverlayDto>' },
            { method: 'DELETE', route: '/api/livestudio/overlays/{overlayId}', action: 'RemoveOverlay', description: 'Remove overlay', auth: 'Bearer(Owner)', returns: 'NoContent' },
        ],
    },
    {
        id: 'messages', name: 'DirectMessagesController', feature: 'messages', icon: '💬', color: '#af52de',
        description: 'DMs with real-time delivery',
        endpoints: [
            { method: 'GET', route: '/api/directmessages/inbox', action: 'GetInbox', description: 'Inbox list', auth: 'Bearer', returns: 'List<ConversationDto>' },
            { method: 'GET', route: '/api/directmessages/{userId}', action: 'GetConversation', description: 'Conversation with user', auth: 'Bearer', returns: 'List<MessageDto>' },
            { method: 'POST', route: '/api/directmessages', action: 'Send', description: 'Send message', auth: 'Bearer', returns: 'MessageDto' },
            { method: 'POST', route: '/api/directmessages/{id}/read', action: 'MarkRead', description: 'Mark as read', auth: 'Bearer', returns: 'NoContent' },
            { method: 'DELETE', route: '/api/directmessages/{id}', action: 'Delete', description: 'Delete message', auth: 'Bearer(Owner)', returns: 'NoContent' },
        ],
    },
    {
        id: 'calls', name: 'CallsController', feature: 'messages', icon: '📞', color: '#af52de',
        description: 'Voice/video calls via WebRTC',
        endpoints: [
            { method: 'POST', route: '/api/calls/initiate', action: 'Initiate', description: 'Start call', auth: 'Bearer', returns: 'CallDto' },
            { method: 'POST', route: '/api/calls/{id}/answer', action: 'Answer', description: 'Answer incoming', auth: 'Bearer', returns: 'IceServers' },
            { method: 'POST', route: '/api/calls/{id}/reject', action: 'Reject', description: 'Reject', auth: 'Bearer', returns: 'NoContent' },
            { method: 'POST', route: '/api/calls/{id}/end', action: 'End', description: 'End call', auth: 'Bearer', returns: 'CallSummaryDto' },
            { method: 'GET', route: '/api/calls/missed', action: 'Missed', description: 'Missed calls', auth: 'Bearer', returns: 'List<CallDto>' },
        ],
    },
    {
        id: 'profiles', name: 'ProfilesController', feature: 'profiles', icon: '👤', color: '#5856d6',
        description: 'User + 3 platform profiles',
        endpoints: [
            { method: 'GET', route: '/api/profiles/me', action: 'GetMe', description: 'Current user', auth: 'Bearer', returns: 'UserProfileDto' },
            { method: 'GET', route: '/api/profiles/my', action: 'GetMyProfiles', description: 'All 3 platform profiles', auth: 'Bearer', returns: 'List<PlatformProfileDto>' },
            { method: 'GET', route: '/api/profiles/{userId}', action: 'GetUser', description: 'Public profile', auth: 'Anonymous', returns: 'UserProfileDto' },
            { method: 'GET', route: '/api/profiles/{userId}/{platform}', action: 'GetByPlatform', description: 'Twitter/IG/TikTok profile', auth: 'Anonymous', returns: 'PlatformProfileDto' },
            { method: 'PUT', route: '/api/profiles/me', action: 'Update', description: 'Update profile', auth: 'Bearer', returns: 'UserProfileDto' },
            { method: 'POST', route: '/api/profiles/avatar', action: 'UploadAvatar', description: 'Upload avatar', auth: 'Bearer', returns: '{ url }' },
            { method: 'POST', route: '/api/profiles/first-post', action: 'CreateFirstPost', description: 'Auto-created welcome post', auth: 'Bearer', returns: 'PostDto' },
        ],
    },
    {
        id: 'follows', name: 'FollowsController', feature: 'social', icon: '👥', color: '#ff2d55',
        description: 'Follow/unfollow graph',
        endpoints: [
            { method: 'POST', route: '/api/follows/{userId}', action: 'Follow', description: 'Follow user', auth: 'Bearer', returns: '{ following: true }' },
            { method: 'DELETE', route: '/api/follows/{userId}', action: 'Unfollow', description: 'Unfollow', auth: 'Bearer', returns: 'NoContent' },
            { method: 'GET', route: '/api/follows/followers', action: 'Followers', description: 'My followers', auth: 'Bearer', returns: 'PagedResult<UserDto>' },
            { method: 'GET', route: '/api/follows/following', action: 'Following', description: 'Who I follow', auth: 'Bearer', returns: 'PagedResult<UserDto>' },
            { method: 'GET', route: '/api/follows/{userId}/mutual', action: 'Mutual', description: 'Mutual followers', auth: 'Bearer', returns: 'List<UserDto>' },
        ],
    },
    {
        id: 'blocks', name: 'BlocksController', feature: 'safety', icon: '🚫', color: '#34c759',
        description: 'Block list management',
        endpoints: [
            { method: 'POST', route: '/api/blocks', action: 'Create', description: 'Block user', auth: 'Bearer', returns: 'BlockDto' },
            { method: 'DELETE', route: '/api/blocks/{userId}', action: 'Delete', description: 'Unblock', auth: 'Bearer', returns: 'NoContent' },
            { method: 'GET', route: '/api/blocks', action: 'GetAll', description: 'My blocks', auth: 'Bearer', returns: 'List<BlockDto>' },
        ],
    },
    {
        id: 'muted', name: 'MutedUsersController', feature: 'safety', icon: '🔇', color: '#34c759',
        description: 'Mute without unfollow',
        endpoints: [
            { method: 'POST', route: '/api/mutedusers', action: 'Create', description: 'Mute user', auth: 'Bearer', returns: 'MuteDto' },
            { method: 'DELETE', route: '/api/mutedusers/{userId}', action: 'Unmute', description: 'Unmute', auth: 'Bearer', returns: 'NoContent' },
            { method: 'GET', route: '/api/mutedusers', action: 'GetAll', description: 'My muted list', auth: 'Bearer', returns: 'List<MuteDto>' },
        ],
    },
    {
        id: 'content-warnings', name: 'ContentWarningsController', feature: 'safety', icon: '⚠️', color: '#34c759',
        description: 'Content warning system',
        endpoints: [
            { method: 'POST', route: '/api/contentwarnings', action: 'Add', description: 'Add warning to post', auth: 'Bearer(Owner)', returns: 'WarningDto' },
            { method: 'DELETE', route: '/api/contentwarnings/{id}', action: 'Remove', description: 'Remove warning', auth: 'Bearer(Owner)', returns: 'NoContent' },
            { method: 'GET', route: '/api/contentwarnings/{postId}', action: 'GetByPost', description: 'Warnings on post', auth: 'Anonymous', returns: 'List<WarningDto>' },
        ],
    },
    {
        id: 'hashtags', name: 'HashtagsController', feature: 'feed', icon: '#️⃣', color: '#34c759',
        description: 'Hashtag system',
        endpoints: [
            { method: 'GET', route: '/api/hashtags', action: 'GetAll', description: 'All hashtags', auth: 'Anonymous', returns: 'List<HashtagDto>' },
            { method: 'GET', route: '/api/hashtags/{id}', action: 'GetById', description: 'Hashtag detail', auth: 'Anonymous', returns: 'HashtagDto' },
            { method: 'GET', route: '/api/hashtags/trending', action: 'Trending', description: 'Top trending', auth: 'Anonymous', returns: 'List<HashtagDto>' },
            { method: 'PUT', route: '/api/hashtags/{id}', action: 'Update', description: 'Rename (mod only)', auth: 'Bearer(Admin)', returns: 'HashtagDto' },
            { method: 'GET', route: '/api/hashtags/{tag}/posts', action: 'GetPosts', description: 'Posts with tag', auth: 'Anonymous', returns: 'PagedResult<PostDto>' },
        ],
    },
    {
        id: 'polls', name: 'PollsController', feature: 'misc', icon: '📊', color: '#8e8e93',
        description: 'Poll creation + voting',
        endpoints: [
            { method: 'POST', route: '/api/polls', action: 'Create', description: 'Create poll (attached to post)', auth: 'Bearer', returns: 'PollDto' },
            { method: 'POST', route: '/api/polls/{id}/vote', action: 'Vote', description: 'Cast vote', auth: 'Bearer', returns: '{ results }' },
            { method: 'GET', route: '/api/polls/{id}', action: 'Get', description: 'Poll detail + results', auth: 'Anonymous', returns: 'PollDto' },
        ],
    },
    {
        id: 'comments', name: 'CommentsController', feature: 'misc', icon: '💭', color: '#8e8e93',
        description: 'Threaded comments',
        endpoints: [
            { method: 'GET', route: '/api/comments/{postId}', action: 'GetByPost', description: 'Comments on post', auth: 'Anonymous', returns: 'List<CommentDto>' },
            { method: 'POST', route: '/api/comments', action: 'Create', description: 'New comment', auth: 'Bearer', returns: 'CommentDto' },
            { method: 'POST', route: '/api/comments/{id}/reply', action: 'Reply', description: 'Threaded reply', auth: 'Bearer', returns: 'CommentDto' },
            { method: 'DELETE', route: '/api/comments/{id}', action: 'Delete', description: 'Delete own', auth: 'Bearer(Owner)', returns: 'NoContent' },
        ],
    },
    {
        id: 'bookmarks', name: 'BookmarksController', feature: 'bookmarks', icon: '🔖', color: '#00c7be',
        description: 'Saved posts',
        endpoints: [
            { method: 'GET', route: '/api/bookmarks', action: 'GetAll', description: 'My bookmarks', auth: 'Bearer', returns: 'PagedResult<PostDto>' },
            { method: 'POST', route: '/api/bookmarks/{postId}', action: 'Create', description: 'Save post', auth: 'Bearer', returns: 'BookmarkDto' },
            { method: 'DELETE', route: '/api/bookmarks/{postId}', action: 'Delete', description: 'Remove bookmark', auth: 'Bearer', returns: 'NoContent' },
        ],
    },
    {
        id: 'collections', name: 'CollectionsController', feature: 'bookmarks', icon: '📚', color: '#00c7be',
        description: 'Custom bookmark collections',
        endpoints: [
            { method: 'GET', route: '/api/collections', action: 'GetAll', description: 'My collections', auth: 'Bearer', returns: 'List<CollectionDto>' },
            { method: 'GET', route: '/api/collections/{id}/items', action: 'GetItems', description: 'Items in collection', auth: 'Bearer', returns: 'List<PostDto>' },
            { method: 'POST', route: '/api/collections', action: 'Create', description: 'New collection', auth: 'Bearer', returns: 'CollectionDto' },
            { method: 'POST', route: '/api/collections/{id}/items', action: 'AddItem', description: 'Add post', auth: 'Bearer', returns: 'NoContent' },
            { method: 'DELETE', route: '/api/collections/{id}/items/{postId}', action: 'RemoveItem', description: 'Remove post', auth: 'Bearer', returns: 'NoContent' },
            { method: 'PUT', route: '/api/collections/{id}/rename', action: 'Rename', description: 'Rename collection', auth: 'Bearer', returns: 'CollectionDto' },
        ],
    },
    {
        id: 'smart-collections', name: 'SmartCollectionsController', feature: 'ai', icon: '🧠', color: '#af52de',
        description: 'AI-suggested bookmark categories',
        endpoints: [
            { method: 'GET', route: '/api/smartcollections/suggest-category/{postId}', action: 'SuggestCategory', description: 'AI category suggestion', auth: 'Bearer', returns: '{ suggestedCategory }' },
            { method: 'GET', route: '/api/smartcollections/grouped', action: 'GetGrouped', description: 'Bookmarks grouped by AI', auth: 'Bearer', returns: 'Dictionary<string, PostDto[]>' },
        ],
    },
    {
        id: 'saved-search', name: 'SavedSearchController', feature: 'ai', icon: '🔍', color: '#af52de',
        description: 'Saved search queries',
        endpoints: [
            { method: 'GET', route: '/api/savedsearch', action: 'GetAll', description: 'My saved searches', auth: 'Bearer', returns: 'List<SavedSearchDto>' },
            { method: 'POST', route: '/api/savedsearch', action: 'Create', description: 'Save search', auth: 'Bearer', returns: 'SavedSearchDto' },
            { method: 'DELETE', route: '/api/savedsearch/{id}', action: 'Delete', description: 'Delete', auth: 'Bearer', returns: 'NoContent' },
            { method: 'DELETE', route: '/api/savedsearch/clear', action: 'ClearAll', description: 'Clear all', auth: 'Bearer', returns: 'NoContent' },
        ],
    },
    {
        id: 'smart-search', name: 'SmartSearchAssistantController', feature: 'ai', icon: '🤖', color: '#af52de',
        description: 'AI-powered search',
        endpoints: [
            { method: 'POST', route: '/api/smartsearchassistant/ask', action: 'Ask', description: 'Natural language query', auth: 'Bearer', returns: 'SearchResultDto' },
        ],
    },
    {
        id: 'duplicate-detector', name: 'DuplicateDetectorController', feature: 'ai', icon: '🔍', color: '#af52de',
        description: 'Detect duplicate content',
        endpoints: [
            { method: 'POST', route: '/api/duplicatedetector/check', action: 'Check', description: 'Check before posting', auth: 'Bearer', returns: '{ isDuplicate, similarTo }' },
        ],
    },
    {
        id: 'important-people', name: 'ImportantPeopleController', feature: 'ai', icon: '⭐', color: '#af52de',
        description: 'Priority users list',
        endpoints: [
            { method: 'GET', route: '/api/importantpeople', action: 'GetAll', description: 'My priority list', auth: 'Bearer', returns: 'List<UserDto>' },
            { method: 'POST', route: '/api/importantpeople/{userId}', action: 'Add', description: 'Add to list', auth: 'Bearer', returns: 'NoContent' },
            { method: 'DELETE', route: '/api/importantpeople/{userId}', action: 'Remove', description: 'Remove', auth: 'Bearer', returns: 'NoContent' },
        ],
    },
    {
        id: 'smart-notifications', name: 'SmartNotificationsController', feature: 'ai', icon: '🔔', color: '#af52de',
        description: 'AI-grouped notifications',
        endpoints: [
            { method: 'GET', route: '/api/smartnotifications', action: 'GetGrouped', description: 'Grouped notifications', auth: 'Bearer', returns: 'List<NotificationGroupDto>' },
            { method: 'POST', route: '/api/smartnotifications/{id}/snooze', action: 'Snooze', description: 'Snooze', auth: 'Bearer', returns: 'NoContent' },
        ],
    },
    {
        id: 'usage-tracking', name: 'UsageTrackingController', feature: 'analytics', icon: '📊', color: '#ff9500',
        description: 'Time tracking + insights',
        endpoints: [
            { method: 'GET', route: '/api/usagetracking/summary', action: 'Summary', description: 'Weekly summary', auth: 'Bearer', returns: 'UsageSummaryDto' },
            { method: 'GET', route: '/api/usagetracking/one-minute-picks', action: 'OneMinutePicks', description: 'Content for 1-minute breaks', auth: 'Bearer', returns: 'List<PostDto>' },
            { method: 'POST', route: '/api/usagetracking/track', action: 'Track', description: 'Track activity', auth: 'Bearer', returns: 'NoContent' },
        ],
    },
    {
        id: 'time-machine', name: 'SocialTimeMachineController', feature: 'analytics', icon: '⏰', color: '#ff9500',
        description: 'Historical feed browser',
        endpoints: [
            { method: 'GET', route: '/api/socialtimemachine/{date}', action: 'GetOnDate', description: 'Posts from specific date', auth: 'Bearer', returns: 'List<PostDto>' },
            { method: 'GET', route: '/api/socialtimemachine/on-this-day', action: 'OnThisDay', description: 'Memories from this day', auth: 'Bearer', returns: 'List<PostDto>' },
        ],
    },
    {
        id: 'health-dashboard', name: 'SocialHealthDashboardController', feature: 'analytics', icon: '💚', color: '#ff9500',
        description: 'Wellbeing metrics',
        endpoints: [
            { method: 'GET', route: '/api/socialhealthdashboard', action: 'Get', description: 'Health metrics', auth: 'Bearer', returns: 'HealthDashboardDto' },
            { method: 'GET', route: '/api/socialhealthdashboard/suggestions', action: 'Suggestions', description: 'AI wellbeing tips', auth: 'Bearer', returns: 'List<string>' },
        ],
    },
    {
        id: 'future-prediction', name: 'FutureRoutePredictionController', feature: 'analytics', icon: '🔮', color: '#ff9500',
        description: 'Predict best posting times',
        endpoints: [
            { method: 'GET', route: '/api/futurerouteprediction/best-posting-time', action: 'BestPostingTime', description: 'Optimal hours', auth: 'Bearer', returns: 'List<BestTimeDto>' },
            { method: 'GET', route: '/api/futurerouteprediction/best-content-type', action: 'BestContentType', description: 'Media vs text performance', auth: 'Bearer', returns: 'ContentTypeStatsDto' },
        ],
    },
    {
        id: 'confessions', name: 'AnonymousConfessionsController', feature: 'misc', icon: '🤫', color: '#8e8e93',
        description: 'Anonymous posting',
        endpoints: [
            { method: 'GET', route: '/api/anonymousconfessions', action: 'GetAll', description: 'Browse confessions', auth: 'Anonymous', returns: 'List<ConfessionDto>' },
            { method: 'POST', route: '/api/anonymousconfessions', action: 'Create', description: 'Submit confession', auth: 'Bearer', returns: 'ConfessionDto' },
        ],
    },
    {
        id: 'social-puzzle', name: 'SocialPuzzleController', feature: 'gamification', icon: '🧩', color: '#ffcc00',
        description: 'Shared interests mini-game',
        endpoints: [
            { method: 'GET', route: '/api/socialpuzzle/shared-interests-now', action: 'SharedInterestsNow', description: 'Shared interests with followers', auth: 'Bearer', returns: 'PuzzleDto' },
        ],
    },
    {
        id: 'post-streaks', name: 'PostingStreaksController', feature: 'gamification', icon: '🔥', color: '#ffcc00',
        description: 'Consecutive posting days',
        endpoints: [
            { method: 'GET', route: '/api/postingstreaks/my', action: 'GetMy', description: 'My streak', auth: 'Bearer', returns: 'StreakDto' },
            { method: 'GET', route: '/api/postingstreaks/leaderboard', action: 'Leaderboard', description: 'Top streaks', auth: 'Bearer', returns: 'List<StreakEntryDto>' },
        ],
    },
    {
        id: 'karma', name: 'KarmaController', feature: 'gamification', icon: '⭐', color: '#ffcc00',
        description: 'Community karma',
        endpoints: [
            { method: 'GET', route: '/api/karma/my', action: 'GetMy', description: 'My karma score', auth: 'Bearer', returns: 'KarmaDto' },
            { method: 'GET', route: '/api/karma/leaderboard', action: 'Leaderboard', description: 'Karma leaderboard', auth: 'Bearer', returns: 'List<KarmaEntryDto>' },
        ],
    },
    {
        id: 'memories', name: 'MemoriesController', feature: 'gamification', icon: '📸', color: '#ffcc00',
        description: 'Throwback content',
        endpoints: [
            { method: 'GET', route: '/api/memories', action: 'Get', description: 'Memories feed', auth: 'Bearer', returns: 'List<PostDto>' },
            { method: 'GET', route: '/api/memories/count', action: 'GetCount', description: 'Count for badge', auth: 'Bearer', returns: '{ count }' },
        ],
    },
    {
        id: 'post-remix', name: 'PostRemixController', feature: 'misc', icon: '🎛', color: '#8e8e93',
        description: 'Remix another post',
        endpoints: [
            { method: 'GET', route: '/api/postremix/of/{postId}', action: 'GetRemixesOf', description: 'All remixes of post', auth: 'Anonymous', returns: 'List<PostDto>' },
            { method: 'GET', route: '/api/postremix/my', action: 'GetMyRemixes', description: 'My remixes', auth: 'Bearer', returns: 'List<PostDto>' },
            { method: 'POST', route: '/api/postremix', action: 'Create', description: 'Create remix', auth: 'Bearer', returns: 'PostDto' },
        ],
    },
    {
        id: 'collab', name: 'CollabPostsController', feature: 'misc', icon: '🤝', color: '#8e8e93',
        description: 'Multi-author posts',
        endpoints: [
            { method: 'GET', route: '/api/collabposts/{id}/coauthors', action: 'GetCoAuthors', description: 'Co-authors list', auth: 'Anonymous', returns: 'List<UserDto>' },
            { method: 'POST', route: '/api/collabposts', action: 'Create', description: 'Create collab post', auth: 'Bearer', returns: 'PostDto' },
        ],
    },
    {
        id: 'post-history', name: 'PostEditHistoryController', feature: 'misc', icon: '📜', color: '#8e8e93',
        description: 'Post edit history',
        endpoints: [
            { method: 'GET', route: '/api/postedithistory/post/{postId}/was-edited', action: 'WasEdited', description: 'Was post edited?', auth: 'Anonymous', returns: '{ wasEdited }' },
            { method: 'GET', route: '/api/postedithistory/post/{postId}', action: 'GetHistory', description: 'Edit history', auth: 'Bearer(Owner)', returns: 'List<HistoryEntry>' },
        ],
    },
    {
        id: 'post-quality', name: 'PostQualityController', feature: 'ai', icon: '✨', color: '#af52de',
        description: 'AI content score',
        endpoints: [
            { method: 'POST', route: '/api/postquality/analyze', action: 'Analyze', description: 'Score draft before posting', auth: 'Bearer', returns: 'QualityScoreDto' },
        ],
    },
    {
        id: 'alt-text', name: 'AltTextController', feature: 'ai', icon: '🖼', color: '#af52de',
        description: 'AI-generated alt text',
        endpoints: [
            { method: 'POST', route: '/api/alttext/generate', action: 'Generate', description: 'Generate from image', auth: 'Bearer', returns: '{ altText }' },
        ],
    },
    {
        id: 'quiet-hours', name: 'QuietHoursController', feature: 'safety', icon: '🌙', color: '#34c759',
        description: 'Do not disturb schedule',
        endpoints: [
            { method: 'GET', route: '/api/quiethours', action: 'Get', description: 'Current schedule', auth: 'Bearer', returns: 'QuietHoursDto' },
            { method: 'PUT', route: '/api/quiethours', action: 'Update', description: 'Set quiet hours', auth: 'Bearer', returns: 'QuietHoursDto' },
        ],
    },
    {
        id: 'profile-visits', name: 'ProfileVisitsController', feature: 'analytics', icon: '👣', color: '#ff9500',
        description: 'Who visited my profile',
        endpoints: [
            { method: 'GET', route: '/api/profilevisits', action: 'GetAll', description: 'Recent visits', auth: 'Bearer', returns: 'List<VisitDto>' },
            { method: 'POST', route: '/api/profilevisits', action: 'Create', description: 'Auto-tracked on profile view', auth: 'Bearer', returns: 'NoContent' },
        ],
    },
    {
        id: 'music', name: 'MusicController', feature: 'music', icon: '🎵', color: '#ff2d55',
        description: 'Music library for stories/reels',
        endpoints: [
            { method: 'GET', route: '/api/music/search', action: 'Search', description: 'Search track', auth: 'Anonymous', returns: 'List<TrackDto>' },
            { method: 'GET', route: '/api/music/trending', action: 'Trending', description: 'Trending tracks', auth: 'Anonymous', returns: 'List<TrackDto>' },
        ],
    },
    {
        id: 'tiktok-feed', name: 'TikTokFeedController', feature: 'music', icon: '🎬', color: '#ff2d55',
        description: 'TikTok-style vertical feed',
        endpoints: [
            { method: 'GET', route: '/api/tiktokfeed/following', action: 'Following', description: 'Following creators', auth: 'Bearer', returns: 'PagedResult<ReelDto>' },
            { method: 'GET', route: '/api/tiktokfeed/trending', action: 'Trending', description: 'Trending now', auth: 'Bearer', returns: 'PagedResult<ReelDto>' },
            { method: 'GET', route: '/api/tiktokfeed/by-hashtag/{tag}', action: 'ByHashtag', description: 'Hashtag feed', auth: 'Bearer', returns: 'PagedResult<ReelDto>' },
            { method: 'GET', route: '/api/tiktokfeed/random', action: 'Random', description: 'Random pick', auth: 'Bearer', returns: 'ReelDto' },
        ],
    },
    {
        id: 'shares', name: 'SharesController', feature: 'misc', icon: '↗', color: '#8e8e93',
        description: 'Share posts to other platforms',
        endpoints: [
            { method: 'GET', route: '/api/shares/{id}', action: 'GetById', description: 'Share detail', auth: 'Bearer', returns: 'ShareDto' },
            { method: 'POST', route: '/api/shares', action: 'Create', description: 'Create share', auth: 'Bearer', returns: 'ShareDto' },
            { method: 'PUT', route: '/api/shares/{id}', action: 'Update', description: 'Update caption', auth: 'Bearer(Owner)', returns: 'ShareDto' },
            { method: 'DELETE', route: '/api/shares/{id}', action: 'Delete', description: 'Delete share', auth: 'Bearer(Owner)', returns: 'NoContent' },
            { method: 'POST', route: '/api/shares/{id}/publish-now', action: 'PublishNow', description: 'Skip schedule', auth: 'Bearer(Owner)', returns: 'ShareDto' },
        ],
    },
    {
        id: 'notifications', name: 'NotificationsController', feature: 'profiles', icon: '🔔', color: '#5856d6',
        description: 'Push + in-app notifications',
        endpoints: [
            { method: 'GET', route: '/api/notifications', action: 'GetAll', description: 'All notifications', auth: 'Bearer', returns: 'PagedResult<NotificationDto>' },
            { method: 'POST', route: '/api/notifications/{id}/read', action: 'MarkRead', description: 'Mark read', auth: 'Bearer', returns: 'NoContent' },
            { method: 'POST', route: '/api/notifications/read-all', action: 'MarkAllRead', description: 'Mark all read', auth: 'Bearer', returns: 'NoContent' },
        ],
    },
    {
        id: 'reports', name: 'ReportsController', feature: 'safety', icon: '🚩', color: '#34c759',
        description: 'Report content',
        endpoints: [
            { method: 'POST', route: '/api/reports', action: 'Create', description: 'Report post/user', auth: 'Bearer', returns: 'ReportDto' },
            { method: 'GET', route: '/api/reports/my', action: 'GetMy', description: 'My reports', auth: 'Bearer', returns: 'List<ReportDto>' },
        ],
    },
    {
        id: 'media', name: 'MediaController', feature: 'posts', icon: '📁', color: '#007aff',
        description: 'Media upload + processing',
        endpoints: [
            { method: 'POST', route: '/api/media/upload', action: 'Upload', description: 'Upload image/video', auth: 'Bearer', returns: '{ url, thumbnailUrl }' },
            { method: 'DELETE', route: '/api/media/{id}', action: 'Delete', description: 'Delete media', auth: 'Bearer(Owner)', returns: 'NoContent' },
        ],
    },
    {
        id: 'analytics', name: 'AnalyticsController', feature: 'analytics', icon: '📈', color: '#ff9500',
        description: 'Personal analytics',
        endpoints: [
            { method: 'GET', route: '/api/analytics/overview', action: 'Overview', description: 'Dashboard KPIs', auth: 'Bearer', returns: 'OverviewDto' },
            { method: 'GET', route: '/api/analytics/engagement', action: 'Engagement', description: 'Engagement chart', auth: 'Bearer', returns: 'ChartDto' },
            { method: 'GET', route: '/api/analytics/audience', action: 'Audience', description: 'Follower demographics', auth: 'Bearer', returns: 'AudienceDto' },
        ],
    },
    {
        id: 'admin', name: 'AdminController', feature: 'safety', icon: '👑', color: '#34c759',
        description: 'Platform admin',
        endpoints: [
            { method: 'GET', route: '/api/admin/users', action: 'Users', description: 'All users', auth: 'Bearer(Admin)', returns: 'PagedResult<UserDto>' },
            { method: 'POST', route: '/api/admin/users/{id}/ban', action: 'Ban', description: 'Ban user', auth: 'Bearer(Admin)', returns: 'NoContent' },
            { method: 'GET', route: '/api/admin/reports', action: 'Reports', description: 'Moderation queue', auth: 'Bearer(Admin)', returns: 'List<ReportDto>' },
            { method: 'POST', route: '/api/admin/reports/{id}/resolve', action: 'Resolve', description: 'Resolve report', auth: 'Bearer(Admin)', returns: 'NoContent' },
        ],
    },
];

export const TOTAL_CONTROLLERS = OMNISOCIAL_CONTROLLERS.length;

export const TOTAL_ENDPOINTS = OMNISOCIAL_CONTROLLERS.reduce(
    (sum, c) => sum + c.endpoints.length, 0
);