// Registration Page for IVR Automation Testing Platform
import { Hono } from 'hono';

const registerPage = new Hono();

registerPage.get('/register', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Register - IVR Automation Testing Platform</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .fade-in { animation: fadeIn 0.5s; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        </style>
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md fade-in">
                <div class="p-8">
                    <div class="text-center mb-8">
                        <div class="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-phone-volume text-blue-600 text-2xl"></i>
                        </div>
                        <h1 class="text-2xl font-bold text-gray-800">IVR Automation Testing</h1>
                        <p class="text-gray-500 mt-2">Create a new account</p>
                    </div>
                    
                    <form id="register-form" class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
                            <input 
                                type="text" 
                                id="username" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Choose a username"
                                required
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input 
                                type="email" 
                                id="email" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="your@email.com"
                                required
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                            <input 
                                type="text" 
                                id="first-name" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Your first name"
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                            <input 
                                type="text" 
                                id="last-name" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Your last name"
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input 
                                type="password" 
                                id="password" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Create a password"
                                required
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                            <input 
                                type="password" 
                                id="confirm-password" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Confirm your password"
                                required
                            >
                        </div>
                        
                        <div class="flex items-center">
                            <input 
                                id="terms" 
                                type="checkbox" 
                                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                required
                            >
                            <label for="terms" class="ml-2 block text-sm text-gray-700">
                                I agree to the <a href="#" class="text-blue-600 hover:text-blue-500">Terms of Service</a> and <a href="#" class="text-blue-600 hover:text-blue-500">Privacy Policy</a>
                            </label>
                        </div>
                        
                        <div>
                            <button 
                                type="submit" 
                                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Create Account
                            </button>
                        </div>
                    </form>
                    
                    <div class="mt-6 text-center">
                        <p class="text-sm text-gray-600">
                            Already have an account? 
                            <a href="/login" class="font-medium text-blue-600 hover:text-blue-500">
                                Sign in
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Message Modal -->
        <div id="modal-message" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div class="p-6 border-b border-gray-200">
                    <h3 id="message-modal-title" class="text-xl font-bold">Message</h3>
                </div>
                <div class="p-6">
                    <p id="message-modal-content" class="text-gray-700"></p>
                </div>
                <div class="p-6 border-t border-gray-200 flex justify-end">
                    <button onclick="closeMessageModal()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">OK</button>
                </div>
            </div>
        </div>
        
        <script>
            // Show message modal
            function showMessageModal(title, message) {
                document.getElementById('message-modal-title').textContent = title;
                document.getElementById('message-modal-content').textContent = message;
                document.getElementById('modal-message').classList.remove('hidden');
            }
            
            // Close message modal
            function closeMessageModal() {
                document.getElementById('modal-message').classList.add('hidden');
            }
            
            // Handle registration form submission
            document.getElementById('register-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const username = document.getElementById('username').value;
                const email = document.getElementById('email').value;
                const firstName = document.getElementById('first-name').value;
                const lastName = document.getElementById('last-name').value;
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirm-password').value;
                
                // Validate passwords match
                if (password !== confirmPassword) {
                    showMessageModal('Registration Failed', 'Passwords do not match');
                    return;
                }
                
                try {
                    const response = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            username, 
                            email, 
                            password,
                            firstName: firstName || undefined,
                            lastName: lastName || undefined
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        showMessageModal('Registration Successful', 'Your account has been created. You can now sign in.');
                        // Optionally redirect to login page after a delay
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 2000);
                    } else {
                        showMessageModal('Registration Failed', data.message || 'Failed to create account');
                    }
                } catch (error) {
                    console.error('Registration error:', error);
                    showMessageModal('Error', 'Failed to register. Please try again.');
                }
            });
        </script>
    </body>
    </html>
  `);
});

export default registerPage;