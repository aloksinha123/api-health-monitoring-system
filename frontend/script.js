const API_URL = "https://4r9zxp4od5.execute-api.ap-south-1.amazonaws.com/dev/getdata";
const DELETE_API_URL = "https://4r9zxp4od5.execute-api.ap-south-1.amazonaws.com/dev/deleteapi";

let chartInstance = null;
let isLoading = false;

// ================= LOAD DATA =================
async function loadData() {
    if (isLoading) return;
    isLoading = true;

    const container = document.getElementById("apiContainer");
    if (container) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px;">
                <div style="width: 32px; height: 32px; border: 3px solid rgba(255, 102, 0, 0.1); border-radius: 50%; border-top-color: var(--primary); animation: spin 1s linear infinite; box-shadow: 0 0 15px rgba(255, 102, 0, 0.2);"></div>
                <div style="margin-top: 16px; color: var(--primary); font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase;">Syncing</div>
            </div>`;
    }

    try {
        const res = await fetch(API_URL + "?t=" + Date.now()); // prevent cache
        const data = await res.json();

        console.log("DATA:", data);

        const container = document.getElementById("apiContainer");
        container.innerHTML = "";

        // ===== WARNING BANNER =====
        const total = data.length;
        const healthy = data.filter(d => d.health === "Healthy").length;
        const down = total - healthy;

        document.getElementById("stats").innerText =
            `Total: ${total} | Healthy: ${healthy} | Down: ${down}`;

        document.getElementById("lastUpdate").innerText =
            "Last Updated: " + new Date().toLocaleTimeString();

        const banner = document.getElementById("warning-banner");

        if (banner) {
            banner.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span>SYSTEM ALERT: ${down} API(s) DOWN OR DEGRADED</span>`;
            banner.style.display = down > 0 ? "flex" : "none";
        }

        // ===== CHART =====
        renderChart(data);

        // ===== CARDS =====
        data.forEach(api => {
            console.log("Rendering:", api.url); // debug

            const card = document.createElement("div");
            card.className = "card";
            if (api.health !== "Healthy") {
                card.classList.add("card-down");
            }

            card.innerHTML = `
                <div class="card-header">
                    <h3>${api.url}</h3>
                    <div class="status-indicator ${api.health === 'Healthy' ? 'status-up' : 'status-down'}">
                        <span class="pulse"></span>
                        ${api.health}
                    </div>
                </div>
                <div class="card-details">
                    <div class="detail-item">
                        <span class="detail-label">Status Code</span>
                        <span class="detail-value">${api.status}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Response Time</span>
                        <span class="detail-value ${parseFloat(api.response_time) > 1.0 ? 'text-warning' : ''}">${api.response_time}s</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Last Checked</span>
                        <span class="detail-value">${new Date(Number(api.last_checked) * 1000).toLocaleString()}</span>
                    </div>
                </div>
                <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
                    <button onclick="deleteAPI('${api.api_id}')" style="background: rgba(255, 51, 51, 0.1); border: 1px solid rgba(255, 51, 51, 0.4); color: #ff6666; padding: 6px 14px; font-size: 11px; border-radius: 6px; transition: all 0.3s;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: middle;"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
                        DELETE
                    </button>
                </div>
            `;

            container.appendChild(card);
        });

    } catch (err) {
        console.error("Error loading data:", err);
    } finally {
        isLoading = false;
    }
}

// ================= TIME FIX =================
function formatTime(timestamp) {
    if (!timestamp) return "N/A";

    const num = Number(timestamp);
    if (isNaN(num)) return "Invalid";

    return new Date(num * 1000).toLocaleString();
}

// ================= CHART =================
function renderChart(data) {
    const ctx = document.getElementById('responseTimeChart').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    const labels = data.map(api => {
        let short = api.url.replace("https://", "").replace("http://", "");
        return short.length > 20 ? short.slice(0, 20) + "..." : short;
    });

    const responseTimes = data.map(api => parseFloat(api.response_time));

    const bgColors = data.map(api =>
        api.status === 200 ? 'rgba(255, 102, 0, 0.6)' : 'rgba(255, 51, 51, 0.6)'
    );

    const borderColors = data.map(api =>
        api.status === 200 ? 'rgba(255, 102, 0, 1)' : 'rgba(255, 51, 51, 1)'
    );

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Response Time (seconds)',
                data: responseTimes,
                minBarLength: 5,
                backgroundColor: bgColors,
                borderColor: borderColors,
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Response Time (s)',
                        color: 'white'
                    },
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: 'white' }
                }
            }
        }
    });
}

// ================= BUTTON =================
async function refreshData() {
    const btn = document.getElementById("refreshBtn");
    if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="spinner" style="width:16px;height:16px;border:2px solid;border-radius:50%;border-top-color:transparent;animation:spin 1s linear infinite;"></svg> REFRESHING...`;
        btn.disabled = true;

        await loadData();

        btn.innerHTML = originalText;
        btn.disabled = false;
    } else {
        loadData();
    }
}

// ================= DELETE API =================
async function deleteAPI(api_id) {
    if (!confirm("Delete this API?")) return;

    try {
        // Optional subtle visual cue on delete could go here, for now using direct API call
        const res = await fetch(DELETE_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ api_id })
        });

        const data = await res.json();
        console.log("DELETE RESPONSE:", data);

        if (res.ok) {
            alert("Deleted successfully");
            loadData(); // refresh UI
        } else {
            alert("Delete failed");
        }

    } catch (err) {
        console.error(err);
        alert("Error deleting API");
    }
}

// ================= AUTO REFRESH =================
setInterval(loadData, 10000);

// ================= INITIAL LOAD =================
window.onload = loadData;