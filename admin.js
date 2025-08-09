// AgentRank Admin Panel JavaScript

// Supabase configuration
const SUPABASE_URL = 'https://ayfruvmmcwyrxtbgzgfh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5ZnJ1dm1tY3d5cnh0Ymd6Z2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5Njk0ODIsImV4cCI6MjA2OTU0NTQ4Mn0.4HRG10J104OR6dG_3ft0fHSkpVwB4pqhe1J5US5lE1M';

// Initialize Supabase client
let supabase;

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase when page loads
    initializeSupabase();
    
    // Load admin data
    loadAdminData();
});

function initializeSupabase() {
    // Load Supabase from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = function() {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized for admin panel');
        loadAdminData();
    };
    document.head.appendChild(script);
}

async function loadAdminData() {
    if (!supabase) {
        console.log('Supabase not initialized yet, retrying in 1 second...');
        setTimeout(loadAdminData, 1000);
        return;
    }
    
    try {
        // Load stats
        await loadStats();
        
        // Load pending agents
        await loadPendingAgents();
        
        // Load all agents
        await loadAllAgents();
        
    } catch (error) {
        console.error('Error loading admin data:', error);
        showNotification('Error loading admin data. Please refresh the page.', 'error');
    }
}

async function loadStats() {
    try {
        // Get all agents
        const { data: allAgents, error } = await supabase
            .from('agents')
            .select('status');
        
        if (error) {
            throw error;
        }
        
        // Calculate stats
        const total = allAgents.length;
        const pending = allAgents.filter(agent => agent.status === 'pending').length;
        const approved = allAgents.filter(agent => agent.status === 'approved').length;
        const rejected = allAgents.filter(agent => agent.status === 'rejected').length;
        
        // Update UI
        document.getElementById('total-agents').textContent = total;
        document.getElementById('pending-agents').textContent = pending;
        document.getElementById('approved-agents').textContent = approved;
        document.getElementById('rejected-agents').textContent = rejected;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadPendingAgents() {
    try {
        // Show loading state
        document.getElementById('admin-loading-state').classList.remove('hidden');
        document.getElementById('pending-agents-container').classList.add('hidden');
        document.getElementById('no-pending-agents').classList.add('hidden');
        
        // Fetch pending agents
        const { data: pendingAgents, error } = await supabase
            .from('agents')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        // Hide loading state
        document.getElementById('admin-loading-state').classList.add('hidden');
        
        if (!pendingAgents || pendingAgents.length === 0) {
            // Show empty state
            document.getElementById('no-pending-agents').classList.remove('hidden');
            return;
        }
        
        // Show pending agents table and populate it
        document.getElementById('pending-agents-container').classList.remove('hidden');
        populatePendingAgents(pendingAgents);
        
    } catch (error) {
        console.error('Error loading pending agents:', error);
        document.getElementById('admin-loading-state').classList.add('hidden');
    }
}

function populatePendingAgents(agents) {
    const tbody = document.getElementById('pending-agents-body');
    tbody.innerHTML = '';
    
    agents.forEach(agent => {
        const row = createPendingAgentRow(agent);
        tbody.appendChild(row);
    });
}

function createPendingAgentRow(agent) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    
    const createdDate = new Date(agent.created_at).toLocaleDateString();
    const categoryFormatted = agent.category.charAt(0).toUpperCase() + agent.category.slice(1).replace('-', ' ');
    
    row.innerHTML = `
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
                    <div class="text-sm text-gray-500">${agent.description.length > 60 ? agent.description.substring(0, 60) + '...' : agent.description}</div>
                </div>
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="text-sm text-gray-900">${categoryFormatted}</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${agent.agent_type === 'web3' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
                ${agent.agent_type.toUpperCase()}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${createdDate}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div class="flex space-x-2">
                <button onclick="approveAgent('${agent.id}')" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors">
                    Approve
                </button>
                <button onclick="rejectAgent('${agent.id}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors">
                    Reject
                </button>
            </div>
        </td>
    `;
    
    return row;
}

async function loadAllAgents() {
    try {
        // Fetch all agents
        const { data: allAgents, error } = await supabase
            .from('agents')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        populateAllAgents(allAgents);
        
    } catch (error) {
        console.error('Error loading all agents:', error);
    }
}

function populateAllAgents(agents) {
    const tbody = document.getElementById('all-agents-body');
    tbody.innerHTML = '';
    
    agents.forEach(agent => {
        const row = createAllAgentRow(agent);
        tbody.appendChild(row);
    });
}

function createAllAgentRow(agent) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    
    const categoryFormatted = agent.category.charAt(0).toUpperCase() + agent.category.slice(1).replace('-', ' ');
    
    // Status styling
    const statusClass = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'approved': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800'
    }[agent.status] || 'bg-gray-100 text-gray-800';
    
    // Badge styling
    const badgeClass = {
        'free': 'bg-gray-100 text-gray-800',
        'silver': 'bg-gray-200 text-gray-800',
        'gold': 'bg-yellow-100 text-yellow-800'
    }[agent.badge] || 'bg-gray-100 text-gray-800';
    
    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
                <div class="flex-shrink-0 h-8 w-8">
                    ${agent.avatar_url ? 
                        `<img class="h-8 w-8 rounded-full object-cover" src="${agent.avatar_url}" alt="${agent.name}">` :
                        `<div class="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <span class="text-green-800 text-xs font-semibold">${agent.name.charAt(0).toUpperCase()}</span>
                        </div>`
                    }
                </div>
                <div class="ml-3">
                    <div class="text-sm font-medium text-gray-900">${agent.name}</div>
                </div>
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="text-sm text-gray-900">${categoryFormatted}</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                ${agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ${agent.score}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badgeClass}">
                ${agent.badge.charAt(0).toUpperCase() + agent.badge.slice(1)}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div class="flex space-x-2">
                ${agent.status === 'approved' ? 
                    `<button onclick="changeBadge('${agent.id}', '${agent.badge}')" class="text-indigo-600 hover:text-indigo-900 transition-colors">
                        Edit Badge
                    </button>` : 
                    `<button onclick="deleteAgent('${agent.id}')" class="text-red-600 hover:text-red-900 transition-colors">
                        Delete
                    </button>`
                }
            </div>
        </td>
    `;
    
    return row;
}

async function approveAgent(agentId) {
    try {
        const { error } = await supabase
            .from('agents')
            .update({ status: 'approved' })
            .eq('id', agentId);
        
        if (error) {
            throw error;
        }
        
        showNotification('Agent approved successfully!', 'success');
        loadAdminData(); // Refresh all data
        
    } catch (error) {
        console.error('Error approving agent:', error);
        showNotification('Error approving agent. Please try again.', 'error');
    }
}

async function rejectAgent(agentId) {
    try {
        const { error } = await supabase
            .from('agents')
            .update({ status: 'rejected' })
            .eq('id', agentId);
        
        if (error) {
            throw error;
        }
        
        showNotification('Agent rejected.', 'success');
        loadAdminData(); // Refresh all data
        
    } catch (error) {
        console.error('Error rejecting agent:', error);
        showNotification('Error rejecting agent. Please try again.', 'error');
    }
}

async function changeBadge(agentId, currentBadge) {
    const badges = ['free', 'silver', 'gold'];
    const currentIndex = badges.indexOf(currentBadge);
    const nextIndex = (currentIndex + 1) % badges.length;
    const newBadge = badges[nextIndex];
    
    try {
        const { error } = await supabase
            .from('agents')
            .update({ badge: newBadge })
            .eq('id', agentId);
        
        if (error) {
            throw error;
        }
        
        showNotification(`Badge updated to ${newBadge}!`, 'success');
        loadAdminData(); // Refresh all data
        
    } catch (error) {
        console.error('Error updating badge:', error);
        showNotification('Error updating badge. Please try again.', 'error');
    }
}

async function deleteAgent(agentId) {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('agents')
            .delete()
            .eq('id', agentId);
        
        if (error) {
            throw error;
        }
        
        showNotification('Agent deleted successfully.', 'success');
        loadAdminData(); // Refresh all data
        
    } catch (error) {
        console.error('Error deleting agent:', error);
        showNotification('Error deleting agent. Please try again.', 'error');
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

