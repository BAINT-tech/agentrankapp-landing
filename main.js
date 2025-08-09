// AgentRank Landing Page JavaScript

// Supabase configuration
const SUPABASE_URL = 'https://ayfruvmmcwyrxtbgzgfh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5ZnJ1dm1tY3d5cnh0Ymd6Z2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5Njk0ODIsImV4cCI6MjA2OTU0NTQ4Mn0.4HRG10J104OR6dG_3ft0fHSkpVwB4pqhe1J5US5lE1M';

// Initialize Supabase client (will be loaded from CDN)
let supabase;

// DOM elements
const launchAgentBtn = document.getElementById('launch-agent-btn');
const launchModal = document.getElementById('launch-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelBtn = document.getElementById('cancel-btn');
const launchAgentForm = document.getElementById('launch-agent-form');
const agentTypeRadios = document.querySelectorAll('input[name="agentType"]');
const walletAddressField = document.getElementById('walletAddressField');

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase when page loads
    initializeSupabase();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadAgentLeaderboard();
});

function initializeSupabase() {
    // Load Supabase from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = function() {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized');
    };
    document.head.appendChild(script);
}

function setupEventListeners() {
    // Launch Agent button
    launchAgentBtn.addEventListener('click', openLaunchModal);
    
    // Close modal buttons
    closeModalBtn.addEventListener('click', closeLaunchModal);
    cancelBtn.addEventListener('click', closeLaunchModal);
    
    // Close modal when clicking outside
    launchModal.addEventListener('click', function(e) {
        if (e.target === launchModal) {
            closeLaunchModal();
        }
    });
    
    // Agent type toggle
    agentTypeRadios.forEach(radio => {
        radio.addEventListener('change', toggleWalletField);
    });
    
    // Form submission
    launchAgentForm.addEventListener('submit', handleFormSubmission);
}

function openLaunchModal() {
    launchModal.classList.remove('hidden');
}

function closeLaunchModal() {
    launchModal.classList.add('hidden');
    launchAgentForm.reset();
    walletAddressField.classList.add('hidden');
}

function toggleWalletField() {
    const selectedType = document.querySelector('input[name="agentType"]:checked').value;
    if (selectedType === 'web3') {
        walletAddressField.classList.remove('hidden');
        document.getElementById('walletAddress').required = true;
    } else {
        walletAddressField.classList.add('hidden');
        document.getElementById('walletAddress').required = false;
    }
}

async function handleFormSubmission(e) {
    e.preventDefault();
    
    if (!supabase) {
        showNotification('Supabase not initialized yet. Please try again.', 'error');
        return;
    }
    
    // Get form data
    const formData = new FormData(launchAgentForm);
    const agentData = {
        name: formData.get('agentName'),
        description: formData.get('agentDescription'),
        category: formData.get('agentCategory'),
        agent_type: formData.get('agentType'),
        wallet_address: formData.get('walletAddress') || null,
        status: 'pending', // Default status for new agents
        score: 0, // Default score
        badge: 'free', // Default badge
        created_at: new Date().toISOString()
    };
    
    try {
        // Handle avatar upload if provided
        let avatarUrl = null;
        const avatarFile = formData.get('agentAvatar');
        if (avatarFile && avatarFile.size > 0) {
            avatarUrl = await uploadAvatar(avatarFile, agentData.name);
            agentData.avatar_url = avatarUrl;
        }
        
        // Insert agent data into Supabase
        const { data, error } = await supabase
            .from('agents')
            .insert([agentData]);
        
        if (error) {
            throw error;
        }
        
        showNotification('Agent submitted successfully! It will be reviewed and added to the leaderboard.', 'success');
        closeLaunchModal();
        
        // Refresh the leaderboard
        loadAgentLeaderboard();
        
    } catch (error) {
        console.error('Error submitting agent:', error);
        showNotification('Error submitting agent. Please try again.', 'error');
    }
}

async function uploadAvatar(file, agentName) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${agentName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
            .from('agent-avatars')
            .upload(fileName, file);
        
        if (error) {
            throw error;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('agent-avatars')
            .getPublicUrl(fileName);
        
        return publicUrl;
    } catch (error) {
        console.error('Error uploading avatar:', error);
        return null;
    }
}

async function loadAgentLeaderboard() {
    if (!supabase) {
        console.log('Supabase not initialized yet, retrying in 1 second...');
        setTimeout(loadAgentLeaderboard, 1000);
        return;
    }
    
    try {
        // Show loading state
        document.getElementById('loading-state').classList.remove('hidden');
        document.getElementById('leaderboard-container').classList.add('hidden');
        document.getElementById('empty-state').classList.add('hidden');
        
        // Fetch approved agents from Supabase, ordered by score
        const { data: agents, error } = await supabase
            .from('agents')
            .select('*')
            .eq('status', 'approved')
            .order('score', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        // Hide loading state
        document.getElementById('loading-state').classList.add('hidden');
        
        if (!agents || agents.length === 0) {
            // Show empty state
            document.getElementById('empty-state').classList.remove('hidden');
            return;
        }
        
        // Show leaderboard and populate it
        document.getElementById('leaderboard-container').classList.remove('hidden');
        populateLeaderboard(agents);
        
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        document.getElementById('loading-state').classList.add('hidden');
        showNotification('Error loading leaderboard. Please refresh the page.', 'error');
    }
}

function populateLeaderboard(agents) {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';
    
    agents.forEach((agent, index) => {
        const row = createAgentRow(agent, index + 1);
        tbody.appendChild(row);
    });
}

function createAgentRow(agent, rank) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    
    // Badge styling
    const badgeClass = {
        'free': 'bg-gray-100 text-gray-800',
        'silver': 'bg-gray-200 text-gray-800',
        'gold': 'bg-yellow-100 text-yellow-800'
    }[agent.badge] || 'bg-gray-100 text-gray-800';
    
    // Category formatting
    const categoryFormatted = agent.category.charAt(0).toUpperCase() + agent.category.slice(1).replace('-', ' ');
    
    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
                <span class="text-lg font-bold text-gray-900">#${rank}</span>
                ${rank <= 3 ? `<span class="ml-2 text-xl">${rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>` : ''}
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                    ${agent.avatar_url ? 
                        `<img class="h-10 w-10 rounded-full object-cover" src="${agent.avatar_url}" alt="${agent.name}">` :
                        `<div class="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span class="text-green-800 font-semibold">${agent.name.charAt(0).toUpperCase()}</span>
                        </div>`
                    }
                </div>
                <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">${agent.name}</div>
                    <div class="text-sm text-gray-500">${agent.description.length > 50 ? agent.description.substring(0, 50) + '...' : agent.description}</div>
                </div>
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="text-sm text-gray-900">${categoryFormatted}</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badgeClass}">
                ${agent.badge.charAt(0).toUpperCase() + agent.badge.slice(1)}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">${agent.score}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div class="flex space-x-2">
                <button onclick="voteAgent('${agent.id}', 'up')" class="text-green-600 hover:text-green-900 transition-colors" title="Upvote">
                    👍
                </button>
                <button onclick="voteAgent('${agent.id}', 'down')" class="text-red-600 hover:text-red-900 transition-colors" title="Downvote">
                    👎
                </button>
            </div>
        </td>
    `;
    
    return row;
}

async function voteAgent(agentId, voteType) {
    if (!supabase) {
        showNotification('Supabase not initialized yet. Please try again.', 'error');
        return;
    }
    
    try {
        // For now, we'll implement a simple voting system
        // In a real application, you'd want to track user votes to prevent duplicate voting
        
        // Get current agent data
        const { data: agent, error: fetchError } = await supabase
            .from('agents')
            .select('score')
            .eq('id', agentId)
            .single();
        
        if (fetchError) {
            throw fetchError;
        }
        
        // Calculate new score
        const scoreChange = voteType === 'up' ? 1 : -1;
        const newScore = Math.max(0, agent.score + scoreChange); // Prevent negative scores
        
        // Update the score
        const { error: updateError } = await supabase
            .from('agents')
            .update({ score: newScore })
            .eq('id', agentId);
        
        if (updateError) {
            throw updateError;
        }
        
        showNotification(`Vote recorded! Agent ${voteType === 'up' ? 'upvoted' : 'downvoted'}.`, 'success');
        
        // Refresh the leaderboard
        loadAgentLeaderboard();
        
    } catch (error) {
        console.error('Error voting:', error);
        showNotification('Error recording vote. Please try again.', 'error');
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

