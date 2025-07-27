import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global variables for Firebase instances (declared in window scope for accessibility)
window.app = null;
window.db = null;
window.auth = null;
window.userId = null;
window.isAuthReady = false;

// --- DEMO DATA (Hardcoded for demonstration purposes) ---
// Function to generate random avatar colors
const getRandomAvatarColor = () => {
    const colors = ['#00FFFF', '#FF00FF', '#32CD32', '#FFD700', '#FF4500']; // Cyan, Magenta, LimeGreen, Gold, OrangeRed
    return colors[Math.floor(Math.random() * colors.length)];
};

let demoPosts = [
    {
        id: 'post1',
        userId: 'fitness_fanatic_789',
        content: "Crushed my leg day PR! 🏋️‍♀️ Feeling stronger every session. Consistency is key!",
        imageUrl: "https://placehold.co/600x400/00FFFF/1A1A2E?text=Leg+Day+PR", // Cyan on rypdBlue
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        likes: ['demo_user_123'], // Array of user IDs who liked (demo only)
        comments: [
            { userId: 'gym_buddy_007', text: 'Awesome work! What was your PR on?' },
            { userId: 'strength_seeker', text: 'Inspiring! Keep it up!' }
        ],
        postType: 'Workout Progress',
        mood: 'Pumped',
        avatarColor: getRandomAvatarColor()
    },
    {
        id: 'post2',
        userId: 'healthy_eats_gal',
        content: "Meal prep Sunday success! 🥦🥕 Getting those greens in. Fueling my body right.",
        imageUrl: "https://placehold.co/600x400/32CD32/1A1A2E?text=Meal+Prep", // Lime Green on rypdBlue
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        likes: [],
        comments: [
            { userId: 'nutrition_nerd', text: 'Looks delicious! What recipe did you use?' }
        ],
        postType: 'Nutrition Update',
        mood: 'Achieved',
        avatarColor: getRandomAvatarColor()
    },
    {
        id: 'post3',
        userId: 'cardio_queen_111',
        content: "Just finished a challenging 10k run! 🏃‍♀️💨 Feeling invigorated. Who else loves morning cardio?",
        imageUrl: "",
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        likes: ['demo_user_123', 'gym_buddy_007'],
        comments: [],
        postType: 'General Update',
        mood: 'Pumped',
        avatarColor: getRandomAvatarColor()
    }
];

let demoUserProfile = {
    userId: 'loading...', // Will be updated by Firebase auth
    profilePic: 'https://placehold.co/100x100/00FFFF/1A1A2E?text=User', // Cyan on rypdBlue
    bio: 'Fitness enthusiast | On a journey to strength and health!',
    goals: 'Gain 10lbs muscle, run a 5k',
    currentWeight: '75 kg',
    height: '175 cm',
    badges: [
        { name: 'First Workout', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-rypdAccentPrimaryTo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 17H2a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z"/><path d="M7 10v4"/><path d="M12 10v4"/><path d="M17 10v4"/></svg>' },
        { name: '7-Day Streak', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-rypdAccentGreen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H7l5 5-5 5h10l-5 5"/><path d="m12 19 5-5-5-5-5 5 5 5z"/></svg>' },
        { name: 'PR Breaker', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-rypdAccentMagenta" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 18V12m0 0 4 4m-4-4-4 4"/></svg>' }
            ],
            weightHistory: [ // For progress chart
                { date: '2025-01-01', weight: 80 },
                { date: '2025-02-01', weight: 79 },
                { date: '2025-03-01', weight: 78 },
                { date: '2025-04-01', weight: 77 },
                { date: '2025-05-01', weight: 76 },
                { date: '2025-06-01', weight: 75 },
                { date: '2025-07-01', weight: 74.5 }
            ]
        };

        let demoWeightLogs = [ // This is for the list view, separate from chart data
            { date: 'July 20, 2025', weight: '74.5 kg' },
            { date: 'July 13, 2025', weight: '74 kg' },
            { date: 'July 06, 2025', weight: '73.8 kg' }
        ];

        let demoWorkouts = [
            {
                id: 'workout1',
                name: 'Cosmic Full Body',
                exercises: [
                    { name: 'Barbell Squats', sets: '3', reps: '8-10', notes: 'Focus on depth' },
                    { name: 'Bench Press', sets: '3', reps: '8-10', notes: 'Control negative' },
                    { name: 'Bent-Over Rows', sets: '3', reps: '8-10', notes: 'Squeeze shoulder blades' },
                    { name: 'Overhead Press', sets: '3', reps: '8-10', notes: 'Full lockout' },
                    { name: 'Plank', sets: '3', reps: '60s hold', notes: 'Keep core tight' }
                ]
            },
            {
                id: 'workout2',
                name: 'Power Surge Legs',
                exercises: [
                    { name: 'Deadlifts', sets: '3', reps: '5-8', notes: 'Hinge at hips' },
                    { name: 'Leg Press', sets: '3', reps: '10-12', notes: 'Push through heels' },
                    { name: 'Leg Curls', sets: '3', reps: '12-15', notes: 'Slow and controlled' },
                    { name: 'Calf Raises', sets: '4', reps: '15-20', notes: 'Full stretch and squeeze' }
                ]
            },
            {
                id: 'workout3',
                name: 'Invisible Core',
                exercises: [
                    { name: 'Crunches', sets: '3', reps: '15-20', notes: 'Engage abs' },
                    { name: 'Leg Raises', sets: '3', reps: '15-20', notes: 'Keep back flat' },
                    { name: 'Russian Twists', sets: '3', reps: '20-30', notes: 'Twist from torso' }
                ]
            }
        ];

        let demoChallenges = [
            {
                id: 'challenge1',
                title: '30-Day Squat Challenge',
                description: 'Complete 100 squats daily for 30 days!',
                participants: 500
            },
            {
                id: 'challenge2',
                title: 'Weekly Step Goal (100k Steps)',
                description: 'Hit 100,000 steps in a single week!',
                participants: 1200
            },
            {
                id: 'challenge3',
                title: 'Plank Hold Master',
                description: 'Improve your plank hold time by 30 seconds over 2 weeks!',
                participants: 300
            }
        ];

        let demoMessages = [
            { from: 'gym_buddy_007', text: 'Hey, great progress on your PR! When are you hitting the gym next?' },
            { from: 'You', text: 'Thanks! Planning for Tuesday evening. Want to join?' },
            { from: 'fitness_fanatic_789', text: 'Just saw your meal prep post, looks amazing! Need to try that recipe.' }
        ];

        let demoFoodLog = [
            { name: 'Chicken Breast (150g)', calories: 240, protein: 45, carbs: 0, fats: 6 },
            { name: 'Brown Rice (1 cup cooked)', calories: 215, protein: 5, carbs: 45, fats: 2 },
            { name: 'Broccoli (100g)', calories: 34, protein: 2, carbs: 7, fats: 0 },
            { name: 'Protein Shake', calories: 120, protein: 25, carbs: 4, fats: 1 }
        ];

        // New: Demo chat data for Instagram/WhatsApp style messages
        let demoChats = [
            {
                id: 'chat1',
                name: 'Gym Buddy',
                avatar: 'https://placehold.co/50x50/00FFFF/1A1A2E?text=GB', // Cyan on rypdBlue
                lastMessage: 'Awesome PR! See you Tuesday?',
                messages: [
                    { sender: 'Gym Buddy', text: 'Hey, great progress on your PR! When are you hitting the gym next?', time: '10:30 AM' },
                    { sender: 'You', text: 'Thanks! Planning for Tuesday evening. Want to join?', time: '10:35 AM' },
                    { sender: 'Gym Buddy', text: 'Definitely! What time works for you?', time: '10:40 AM' },
                    { sender: 'You', text: 'Around 6 PM?', time: '10:45 AM' }
                ]
            },
            {
                id: 'chat2',
                name: 'Nutrition Tips',
                avatar: 'https://placehold.co/50x50/32CD32/FFFFFF?text=NT',
                lastMessage: 'Your meal prep looks great!',
                messages: [
                    { sender: 'Nutrition Tips', text: 'Your meal prep looks great! What recipe did you use for the chicken?', time: 'Yesterday' },
                    { sender: 'You', text: 'It\'s a simple lemon-herb marinade! Super easy.', time: 'Yesterday' }
                ]
            },
            {
                id: 'chat3',
                name: 'Challenge Crew',
                avatar: 'https://placehold.co/50x50/FF00FF/FFFFFF?text=CC',
                lastMessage: 'Did anyone hit their squat goal today?',
                messages: [
                    { sender: 'Challenge Crew', text: 'Morning everyone! Did anyone hit their squat goal today?', time: '8:00 AM' },
                    { sender: 'You', text: 'I did! Feeling the burn!', time: '8:05 AM' },
                    { sender: 'Challenge Crew', text: 'Awesome! Keep pushing!', time: '8:10 AM' }
                ]
            },
            // Fantastic Four Characters as chat contacts
            {
                id: 'chat_reed',
                name: 'Reed Richards',
                avatar: 'https://placehold.co/50x50/6A0DAD/FFFFFF?text=RR', // Purple for Reed
                lastMessage: 'Analyzing optimal stretching routines...',
                messages: [
                    { sender: 'Reed Richards', text: 'Greetings. I\'ve been analyzing the optimal biomechanics for your current training phase. Fascinating.', time: '11:00 AM' },
                    { sender: 'You', text: 'Hey Reed! Any insights on improving my deadlift form?', time: '11:05 AM' },
                    { sender: 'Reed Richards', text: 'Indeed. Focus on hip hinge initiation and maintaining a neutral spine. The kinetic chain is paramount.', time: '11:10 AM' }
                ]
            },
            {
                id: 'chat_sue',
                name: 'Sue Storm',
                avatar: 'https://placehold.co/50x50/00FFFF/1A1A2E?text=SS', // Cyan for Sue
                lastMessage: 'Just finished an invisible cardio session!',
                messages: [
                    { sender: 'Sue Storm', text: 'Had a great, totally invisible cardio session today! Feeling energized.', time: '09:00 AM' },
                    { sender: 'You', text: 'Nice! How do you stay so consistent?', time: '09:05 AM' },
                    { sender: 'Sue Storm', text: 'Discipline and a clear vision of my goals. And sometimes, a little protective barrier helps!', time: '09:10 AM' }
                ]
            },
            {
                id: 'chat_johnny',
                name: 'Johnny Storm',
                avatar: 'https://placehold.co/50x50/FF4500/FFFFFF?text=JS', // Orange for Johnny
                lastMessage: 'Flame On! Just torched my last workout.',
                messages: [
                    { sender: 'Johnny Storm', text: 'Flame On! Just torched my last workout. Feeling hot!', time: '02:00 PM' },
                    { sender: 'You', text: 'Haha, awesome! What did you hit today?', time: '02:05 PM' },
                    { sender: 'Johnny Storm', text: 'Shoulders and arms! The pump was insane. You gotta feel the burn!', time: '02:10 PM' }
                ]
            },
            {
                id: 'chat_ben',
                name: 'Ben Grimm',
                avatar: 'https://placehold.co/50x50/8B4513/FFFFFF?text=BG', // Saddle Brown for Ben
                lastMessage: 'Time for some clobberin\'... the weights!',
                messages: [
                    { sender: 'Ben Grimm', text: 'Alright, it\'s clobberin\' time... for these weights! Just hit a new squat PR.', time: '04:00 PM' },
                    { sender: 'You', text: 'Nice, Ben! What was the weight?', time: '04:05 PM' },
                    { sender: 'Ben Grimm', text: 'Heavy enough to make a rock sweat! Keep pushin\' yourself, pal.', time: '04:10 PM' }
                ]
            },
            { // Rypd AI chat contact
                id: 'chat_ai',
                name: 'Rypd AI',
                avatar: 'https://placehold.co/50x50/6A0DAD/FFFFFF?text=AI', // Purple avatar for AI
                lastMessage: 'How can I assist you today?',
                messages: [
                    { sender: 'Rypd AI', text: 'Hello! I am Rypd AI. How can I assist you with your fitness journey today?', time: 'Just now' }
                ],
                isAI: true // Flag to identify AI chat
            }
        ];

        // New: Demo data for certified studies
        const demoStudies = [
            {
                title: "Resistance Training for Bone Density",
                summary: "Meta-analysis: High-intensity RT (≥70% 1RM), 3x/week for ≥48 weeks, significantly improves bone mineral density (BMD) in postmenopausal women.",
                source: "ResearchGate (Meta-analysis)",
                url: "https://www.researchgate.net/publication/392127893_Optimal_resistance_training_parameters_for_improving_bone_mineral_density_in_postmenopausal_women_a_systematic_review_and_meta-analysis",
                icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-rypdAccentPrimaryTo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>'
            },
            {
                title: "Protein Intake for Muscle Hypertrophy",
                summary: "Systematic review: Increased daily protein intake (≥1.6 g/kg/day for younger adults) leads to small but significant gains in lean body mass and lower body strength during resistance training.",
                source: "PMC (PubMed Central)",
                url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8978023/",
                icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-rypdAccentGreen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>'
            },
            {
                title: "Sleep Deprivation & Athletic Performance",
                summary: "Systematic review: Sleep deprivation significantly impairs athletic performance across various domains (endurance, power, speed) and increases perceived exertion.",
                source: "ResearchGate (Systematic Review)",
                url: "https://www.researchgate.net/publication/390412065_Effects_of_sleep_deprivation_on_sports_performance_and_perceived_exertion_in_athletes_and_non-athletes_a_systematic_review_and_meta-analysis",
                icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-rypdAccentMagenta" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>'
            },
            {
                title: "Mediterranean Diet & Cardiovascular Health",
                summary: "Systematic review: Mediterranean and low-fat dietary programs reduce all-cause mortality and non-fatal myocardial infarction in patients with increased cardiovascular risk.",
                source: "The BMJ (Systematic Review)",
                url: "https://www.bmj.com/content/380/bmj-2022-072003",
                icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-rypdAccentGold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20"/></svg>'
            }
        ];

        // New: Demo data for nutrition recipes
        const demoRecipes = [
            {
                id: 'recipe1',
                name: 'High-Protein Cosmic Chicken Stir-fry',
                description: 'Quick and easy stir-fry packed with protein and veggies, for cosmic energy!',
                imageUrl: 'https://placehold.co/600x400/32CD32/1A1A2E?text=Cosmic+Stir-fry',
                macros: 'P:40g C:30g F:15g',
                ingredients: ['150g Chicken Breast', '1 cup Mixed Veggies', '1/2 cup Brown Rice', 'Soy Sauce', 'Ginger', 'Garlic'],
                instructions: '1. Cook rice. 2. Stir-fry chicken. 3. Add veggies, sauce. Serve.'
            },
            {
                id: 'recipe2',
                name: 'Galactic Berry Protein Smoothie',
                description: 'Refreshing smoothie perfect for post-workout recovery, powered by the stars!',
                imageUrl: 'https://placehold.co/600x400/00FFFF/1A1A2E?text=Galactic+Smoothie',
                macros: 'P:25g C:40g F:5g',
                ingredients: ['1 scoop Protein Powder', '1 cup Mixed Berries', '1/2 Banana', '1 cup Almond Milk'],
                instructions: '1. Blend all ingredients until smooth.'
            },
            {
                id: 'recipe3',
                name: 'Thing\'s Rock-Solid Chili',
                description: 'A hearty chili to build a rock-solid physique, strong enough for Clobberin\' Time!',
                imageUrl: 'https://placehold.co/600x400/FF4500/FFFFFF?text=Rock-Solid+Chili',
                macros: 'P:35g C:50g F:10g',
                ingredients: ['Ground Beef', 'Kidney Beans', 'Tomatoes', 'Onion', 'Spices'],
                instructions: '1. Brown meat. 2. Add ingredients, simmer. 3. Enjoy!'
            }
        ];


        // UI Element References (Declared here, assigned in window.onload)
        let splashScreen;
        let continueAppBtn;
        let contentArea;
        let navBar;
        const navButtons = {}; // Will be populated dynamically in window.onload
        let messageDisplay;
        let clobberinTimeMsg;

        let currentPage = 'feed'; // Initial page
        let clobberinTimeClickCount = 0; // For The Thing Easter egg

        // Function to display temporary messages
        function showMessage(msg, duration = 3000) {
            if (!messageDisplay) {
                console.error("showMessage: messageDisplay element not found!");
                return;
            }
            messageDisplay.textContent = msg;
            messageDisplay.classList.remove('opacity-0', 'fade-out');
            messageDisplay.classList.add('opacity-100', 'fade-in');

            setTimeout(() => {
                messageDisplay.classList.remove('opacity-100', 'fade-in');
                messageDisplay.classList.add('opacity-0', 'fade-out');
            }, duration);
        }

        // Function to render different pages with transitions
        function showPage(pageName) {
            console.log(`showPage: Attempting to show page: ${pageName}`);
            // Only apply exit animation if content is currently visible
            if (contentArea && !contentArea.classList.contains('hidden')) {
                contentArea.classList.add('page-exit-animation');
                if (navBar) navBar.classList.add('page-exit-animation');
                contentArea.style.pointerEvents = 'none'; // Disable interaction during transition
                if (navBar) navBar.style.pointerEvents = 'none';
            }

            // Use a small delay to allow exit animation to start before content swap
            setTimeout(() => {
                currentPage = pageName;
                if (contentArea) contentArea.innerHTML = ''; // Clear current content

                // Remove exit animations and prepare for entry
                if (contentArea) contentArea.classList.remove('page-exit-animation', 'app-enter-animation');
                if (navBar) navBar.classList.remove('page-exit-animation', 'app-enter-animation');
                
                // Ensure elements are hidden before rendering new content
                if (contentArea) contentArea.classList.add('hidden');
                if (navBar) navBar.classList.add('hidden');

                // Update active navigation button styles
                Object.keys(navButtons).forEach(key => {
                    const button = navButtons[key];
                    if (button) { // Ensure button element exists
                        if (key === pageName) {
                            button.classList.add('bg-rypdDarkBlue', 'text-rypdAccentPrimaryTo', 'shadow-lg');
                            button.classList.remove('text-rypdLightGray', 'hover:bg-rypdBlue');
                        } else {
                            button.classList.remove('bg-rypdDarkBlue', 'text-rypdAccentPrimaryTo', 'shadow-lg');
                            button.classList.add('text-rypdLightGray', 'hover:bg-rypdBlue');
                        }
                    }
                });

                // Render new page content
                try {
                    switch (pageName) {
                        case 'feed':
                            renderFeedPage();
                            break;
                        case 'create':
                            renderCreatePostPage();
                            break;
                        case 'profile':
                            renderProfilePage();
                            break;
                        case 'ai':
                            renderConversationPage('chat_ai');
                            break;
                        case 'challenges':
                            renderChallengesPage();
                            break;
                        case 'messages':
                            renderMessagesPage();
                            break;
                        case 'studies':
                            renderStudiesPage();
                            break;
                        case 'workouts':
                            renderWorkoutPlansPage();
                            break;
                        case 'recipes':
                            renderNutritionRecipesPage();
                            break;
                        default:
                            renderFeedPage();
                    }
                } catch (renderError) {
                    console.error(`showPage: Error rendering page ${pageName}:`, renderError);
                    showMessage(`Error loading page: ${pageName}`);
                }


                // Apply entry animation and enable interactions
                if (contentArea) {
                    contentArea.classList.remove('hidden');
                    contentArea.classList.add('app-enter-animation');
                    contentArea.style.pointerEvents = 'auto'; // Re-enable interaction
                }
                if (navBar) {
                    navBar.classList.remove('hidden');
                    navBar.classList.add('app-enter-animation');
                    navBar.style.pointerEvents = 'auto'; // Re-enable interaction
                }
                console.log(`showPage: Page ${pageName} rendered and animated.`);

            }, 300); // This timeout should match the page-exit-animation duration
        }


        // Helper to format timestamp
        function formatTimestamp(date) {
            const now = new Date();
            const diffMs = now - date;
            const diffMinutes = Math.round(diffMs / (1000 * 60));
            const diffHours = Math.round(diffMs / (1000 * 60 * 60));
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

            if (diffMinutes < 1) return 'Just now';
            if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
            if (diffHours < 24) return `${diffHours} hours ago`;
            if (diffDays < 7) return `${diffDays} days ago`;
            return date.toLocaleDateString();
        }

        // --- Page Rendering Functions ---

        function renderFeedPage() {
            console.log("renderFeedPage: Starting render...");
            contentArea.innerHTML = `
                <h2 class="text-2xl font-orbitron font-semibold text-rypdWhite mb-6 text-center">Cosmic Feed</h2>
                <div class="bg-rypdDarkBlue rounded-xl shadow-md p-4 mb-6">
                    <h3 class="text-xl font-orbitron font-semibold text-rypdWhite mb-3">Dimensional Highlights ✨</h3>
                    <div class="flex items-center space-x-3 overflow-x-auto pb-2">
                        <div class="flex-shrink-0 text-center">
                            <div class="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-red-500 flex items-center justify-center text-rypdWhite text-xs font-bold mb-1 shimmer-on-hover">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                            </div>
                            <p class="text-xs text-rypdLightGray">#PRs</p>
                        </div>
                        <div class="flex-shrink-0 text-center">
                            <div class="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-rypdWhite text-xs font-bold mb-1 shimmer-on-hover">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H7l5 5-5 5h10l-5 5"/><path d="m12 19 5-5-5-5-5 5 5 5z"/></svg>
                            </div>
                            <p class="text-xs text-rypdLightGray">#Streaks</p>
                        </div>
                        <div class="flex-shrink-0 text-center">
                            <div class="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-rypdWhite text-xs font-bold mb-1 shimmer-on-hover">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                            </div>
                            <p class="text-xs text-rypdLightGray">#Motivation</p>
                        </div>
                        <div class="flex-shrink-0 text-center">
                            <div class="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-rypdWhite text-xs font-bold mb-1 shimmer-on-hover">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            </div>
                            <p class="text-xs text-rypdLightGray">#Community</p>
                        </div>
                    </div>
                </div>
                <div id="posts-container" class="space-y-6"></div>
            `;
            const postsContainer = document.getElementById('posts-container');

            demoPosts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'bg-rypdDarkBlue rounded-xl shadow-md p-6 text-rypdWhite shimmer-on-hover'; // Darker card background, light text, Sue Storm shimmer
                postElement.innerHTML = `
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center text-rypdWhite font-bold text-lg mr-3" style="background-color: ${post.avatarColor};">
                                ${post.userId.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p class="font-semibold text-rypdWhite">${post.userId}</p>
                                <p class="text-sm text-rypdLightGray">${formatTimestamp(post.timestamp)}</p>
                            </div>
                        </div>
                        <button class="bg-gradient-to-r from-rypdAccentPrimaryFrom to-rypdAccentPrimaryTo text-rypdWhite text-xs px-3 py-1 rounded-full hover:from-purple-700 hover:to-blue-600 transition-colors duration-200 follow-button">Follow</button>
                    </div>
                    <p class="text-rypdWhite mb-4">${post.content}</p>
                    ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Progress Image" class="w-full rounded-lg mb-4 object-cover max-h-80">` : ''}
                    <div class="flex justify-between items-center text-sm text-rypdLightGray mb-4">
                        <span class="px-2 py-1 bg-rypdBlue rounded-md">${post.postType}</span>
                        <span class="px-2 py-1 bg-rypdBlue rounded-md">Mood: ${post.mood}</span>
                    </div>
                    <div class="flex items-center justify-between text-rypdLightGray">
                        <button class="flex items-center space-x-1 px-3 py-1 rounded-full hover:bg-rypdBlue transition-colors duration-200 like-button" data-post-id="${post.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ${post.likes.includes(window.userId) ? 'text-rypdAccentRed fill-current' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                            </svg>
                            <span class="like-count">${post.likes.length}</span>
                        </button>
                        <button class="flex items-center space-x-1 px-3 py-1 rounded-full hover:bg-rypdBlue transition-colors duration-200 comment-button" data-post-id="${post.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 11.5a2.5 2.5 0 0 0-5 0v2.5c0 .6-.4 1-1 1H9c-.6 0-1-.4-1-1v-2.5a2.5 2.5 0 0 0-5 0v2.5c0 .6-.4 1-1 1H1c-.6 0-1-.4-1-1V9a2 2 0 0 1 2-2h3c.6 0 1-.4 1-1V3.5A2.5 2.5 0 0 1 10.5 1h3A2.5 2.5 0 0 1 16 3.5V6c0 .6.4 1 1 1h3a2 2 0 0 1 2 2v2.5c0 .6-.4 1-1 1h-1c-.6 0-1-.4-1-1V11.5Z"/>
                            </svg>
                            <span>${post.comments.length}</span>
                        </button>
                    </div>
                    <!-- Sue Storm Invisible Shield Easter Egg -->
                    <svg class="invisible-shield-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20"/>
                    </svg>
                    <div class="comments-section mt-4 hidden">
                        <div class="space-y-2 mb-4">
                            ${post.comments.map(comment => `
                                <div class="bg-rypdBlue p-3 rounded-lg text-sm">
                                    <span class="font-semibold text-rypdWhite">${comment.userId}:</span> ${comment.text}
                                </div>
                            `).join('')}
                        </div>
                        <div class="flex">
                            <input type="text" placeholder="Add a comment..." class="flex-grow p-2 border border-rypdMidBlue rounded-l-lg focus:outline-none focus:ring-2 focus:rypdAccentPrimaryTo bg-rypdBlue text-rypdWhite">
                            <button class="bg-gradient-to-r from-rypdAccentPrimaryFrom to-rypdAccentPrimaryTo text-rypdWhite px-4 py-2 rounded-r-lg hover:from-purple-700 hover:to-blue-600 transition-colors duration-200 add-comment-btn">Post</button>
                        </div>
                    </div>
                `;
                postsContainer.appendChild(postElement);
            });

            // Add event listeners for like and comment buttons
            postsContainer.querySelectorAll('.like-button').forEach(button => {
                button.addEventListener('click', (event) => {
                    const postId = event.currentTarget.dataset.postId;
                    const post = demoPosts.find(p => p.id === postId);
                    if (!post) return;

                    const likeCountSpan = event.currentTarget.querySelector('.like-count');
                    const heartIcon = event.currentTarget.querySelector('svg');

                    if (post.likes.includes(window.userId)) {
                        post.likes = post.likes.filter(id => id !== window.userId);
                        heartIcon.classList.remove('text-rypdAccentRed', 'fill-current');
                        showMessage("Post unliked! (Demo only)");
                    } else {
                        post.likes.push(window.userId);
                        heartIcon.classList.add('text-rypdAccentRed', 'fill-current');
                        event.currentTarget.classList.add('pulse-animation');
                        event.currentTarget.addEventListener('animationend', () => {
                            event.currentTarget.classList.remove('pulse-animation');
                        }, { once: true });
                        showMessage("Post liked! (Demo only)");
                    }
                    likeCountSpan.textContent = post.likes.length;
                });
            });

            postsContainer.querySelectorAll('.comment-button').forEach(button => {
                button.addEventListener('click', (event) => {
                    // This selector targets the immediate parent with the correct background class
                    const commentsSection = event.currentTarget.closest('.bg-rypdDarkBlue').querySelector('.comments-section');
                    commentsSection.classList.toggle('hidden');
                });
            });

            postsContainer.querySelectorAll('.add-comment-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const input = event.currentTarget.previousElementSibling;
                    if (input.value.trim()) {
                        showMessage("Comment added! (Demo only, not saved)");
                        input.value = ''; // Clear input
                    }
                });
            });

            postsContainer.querySelectorAll('.follow-button').forEach(button => {
                button.addEventListener('click', (event) => {
                    const userIdToFollow = event.currentTarget.dataset.userId;
                    showMessage(`Now following ${userIdToFollow}! (Demo only)`);
                    event.currentTarget.textContent = 'Following';
                    event.currentTarget.disabled = true;
                    event.currentTarget.classList.remove('bg-gradient-to-r', 'from-rypdAccentPrimaryFrom', 'to-rypdAccentPrimaryTo', 'hover:from-purple-700', 'hover:to-blue-600');
                    event.currentTarget.classList.add('bg-gray-600', 'cursor-not-allowed');
                });
            });
        }

        function renderCreatePostPage() {
            console.log("renderCreatePostPage: Starting render...");
            contentArea.innerHTML = `
                <h2 class="text-2xl font-orbitron font-semibold text-rypdWhite mb-6 text-center">Create New Post</h2>
                <div class="bg-rypdDarkBlue rounded-xl shadow-md p-6 text-rypdWhite">
                    <div class="mb-4">
                        <label for="new-post-content" class="block text-rypdWhite text-sm font-bold mb-2">What's your progress today?</label>
                        <textarea id="new-post-content" class="w-full p-3 border border-rypdMidBlue rounded-lg focus:outline-none focus:ring-2 focus:ring-rypdAccentPrimaryTo bg-rypdBlue text-rypdWhite h-28 resize-y stretch-on-focus" placeholder="Share your workout, achievement, or thoughts..."></textarea>
                    </div>
                    <div class="mb-4">
                        <label for="new-post-image-url" class="block text-rypdWhite text-sm font-bold mb-2">Image URL (Optional)</label>
                        <input type="text" id="new-post-image-url" class="w-full p-3 border border-rypdMidBlue rounded-lg focus:outline-none focus:ring-2 focus:ring-rypdAccentPrimaryTo bg-rypdBlue text-rypdWhite stretch-on-focus">
                    </div>
                    <div class="mb-4">
                        <label for="post-type-select" class="block text-rypdWhite text-sm font-bold mb-2">Post Type</label>
                        <select id="post-type-select" class="w-full p-3 border border-rypdMidBlue rounded-lg focus:outline-none focus:ring-2 focus:ring-rypdAccentPrimaryTo bg-rypdBlue text-rypdWhite">
                            <option value="General Update">General Update</option>
                            <option value="Workout Progress">Workout Progress</option>
                            <option value="Nutrition Update">Nutrition Update</option>
                            <option value="Achievement">Achievement</option>
                        </select>
                    </div>
                    <div class="mb-6">
                        <label for="mood-select" class="block text-rypdWhite text-sm font-bold mb-2">How are you feeling?</label>
                        <select id="mood-select" class="w-full p-3 border border-rypdMidBlue rounded-lg focus:outline-none focus:ring-2 focus:ring-rypdAccentPrimaryTo bg-rypdBlue text-rypdWhite">
                            <option value="Pumped">Pumped 💪</option>
                            <option value="Achieved">Achieved ✨</option>
                            <option value="Tired">Tired 😴</option>
                            <option value="Motivated">Motivated 🔥</option>
                            <option value="Normal">Normal 😊</option>
                        </select>
                    </div>
                    <button id="share-post-btn" class="w-full bg-gradient-to-r from-rypdAccentPrimaryFrom to-rypdAccentPrimaryTo text-rypdWhite py-3 rounded-lg font-semibold text-lg shadow-lg hover:from-purple-700 hover:to-blue-600 transition-colors duration-300 fiery-glow-on-hover">Share Progress</button>
                </div>
            `;

            document.getElementById('share-post-btn').addEventListener('click', () => {
                const content = document.getElementById('n