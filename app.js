// Konfigurasi aplikasi
const CONFIG = {
    apiUrl: localStorage.getItem('apiUrl') || '',
    apiKey: localStorage.getItem('apiKey') || '',
    itemsPerPage: 10
};

// Elemen UI
const elements = {
    pages: document.querySelectorAll('.page-content'),
    navLinks: document.querySelectorAll('.nav-link'),
    // Dashboard elements
    totalBarang: document.getElementById('total-barang'),
    totalBaik: document.getElementById('total-baik'),
    totalRusakRingan: document.getElementById('total-rusak-ringan'),
    totalRusakBerat: document.getElementById('total-rusak-berat'),
    recentMutasi: document.getElementById('recent-mutasi'),
    // Barang elements
    barangTableBody: document.getElementById('barang-table-body'),
    barangPagination: document.getElementById('barang-pagination'),
    searchBarang: document.getElementById('search-barang'),
    filterKategori: document.getElementById('filter-kategori'),
    filterKondisi: document.getElementById('filter-kondisi'),
    filterLokasi: document.getElementById('filter-lokasi'),
    resetFilter: document.getElementById('reset-filter'),
    exportBarang: document.getElementById('export-barang'),
    // Mutasi elements
    mutasiTableBody: document.getElementById('mutasi-table-body'),
    mutasiPagination: document.getElementById('mutasi-pagination'),
    idBarangMutasi: document.getElementById('id_barang_mutasi'),
    // Pengguna elements
    penggunaTableBody: document.getElementById('pengguna-table-body'),
    // Form elements
    barangForm: document.getElementById('barangForm'),
    mutasiForm: document.getElementById('mutasiForm'),
    penggunaForm: document.getElementById('penggunaForm'),
    // Settings elements
    apiUrlInput: document.getElementById('apiUrl'),
    apiKeyInput: document.getElementById('apiKey')
};

// State aplikasi
let state = {
    barang: [],
    mutasi: [],
    pengguna: [],
    filteredBarang: [],
    currentBarangPage: 1,
    currentMutasiPage: 1,
    selectedBarang: null
};

// Inisialisasi aplikasi
function initApp() {
    // Load settings
    elements.apiUrlInput.value = CONFIG.apiUrl;
    elements.apiKeyInput.value = CONFIG.apiKey;
    
    // Setup navigation
    setupNavigation();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load data jika API sudah dikonfigurasi
    if (CONFIG.apiUrl && CONFIG.apiKey) {
        loadDashboardData();
        loadBarangData();
        loadMutasiData();
        loadPenggunaData();
    } else {
        // Tampilkan modal settings jika API belum dikonfigurasi
        const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
        settingsModal.show();
    }
}

// Setup navigasi
function setupNavigation() {
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            showPage(page);
        });
    });
    
    // Tampilkan halaman dashboard secara default
    showPage('dashboard');
}

// Tampilkan halaman tertentu
function showPage(page) {
    // Sembunyikan semua halaman
    elements.pages.forEach(p => p.classList.add('d-none'));
    
    // Tampilkan halaman yang dipilih
    document.getElementById(`${page}-page`).classList.remove('d-none');
    
    // Update navigasi aktif
    elements.navLinks.forEach(link => {
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Load data untuk halaman tertentu jika diperlukan
    if (page === 'dashboard') {
        loadDashboardData();
    } else if (page === 'barang') {
        loadBarangData();
    } else if (page === 'mutasi') {
        loadMutasiData();
    } else if (page === 'pengguna') {
        loadPenggunaData();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Settings modal
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    
    // Barang form
    document.getElementById('saveBarang').addEventListener('click', saveBarang);
    
    // Mutasi form
    document.getElementById('saveMutasi').addEventListener('click', saveMutasi);
    
    // Pengguna form
    document.getElementById('savePengguna').addEventListener('click', savePengguna);
    
    // Barang filters
    elements.searchBarang.addEventListener('input', filterBarang);
    elements.filterKategori.addEventListener('change', filterBarang);
    elements.filterKondisi.addEventListener('change', filterBarang);
    elements.filterLokasi.addEventListener('change', filterBarang);
    elements.resetFilter.addEventListener('click', resetBarangFilters);
    elements.exportBarang.addEventListener('click', exportBarangToCSV);
    
    // Modal handlers
    const barangModal = document.getElementById('barangModal');
    barangModal.addEventListener('hidden.bs.modal', resetBarangForm);
    
    const mutasiModal = document.getElementById('mutasiModal');
    mutasiModal.addEventListener('shown.bs.modal', loadBarangOptions);
}

// Simpan pengaturan API
function saveSettings() {
    const apiUrl = elements.apiUrlInput.value.trim();
    const apiKey = elements.apiKeyInput.value.trim();
    
    if (!apiUrl || !apiKey) {
        alert('API URL dan API Key harus diisi');
        return;
    }
    
    // Simpan ke localStorage
    localStorage.setItem('apiUrl', apiUrl);
    localStorage.setItem('apiKey', apiKey);
    
    // Update config
    CONFIG.apiUrl = apiUrl;
    CONFIG.apiKey = apiKey;
    
    // Tutup modal
    const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
    settingsModal.hide();
    
    // Muat ulang data
    loadDashboardData();
    loadBarangData();
    loadMutasiData();
    loadPenggunaData();
    
    alert('Pengaturan berhasil disimpan');
}

// API Call function
async function apiCall(resource, action, data = null, id = null) {
    if (!CONFIG.apiUrl || !CONFIG.apiKey) {
        throw new Error('API URL atau API Key belum dikonfigurasi');
    }
    
    let url = `${CONFIG.apiUrl}?resource=${resource}&action=${action}&apiKey=${CONFIG.apiKey}`;
    
    if (id) {
        url += `&id=${id}`;
    }
    
    const options = {
        method: data ? 'POST' : 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify({...data, apiKey: CONFIG.apiKey});
    }
    
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (result.status === 'success') {
            return result.data;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Load data dashboard
async function loadDashboardData() {
    try {
        const barang = await apiCall('barang', 'list');
        const mutasi = await apiCall('mutasi', 'list');
        
        // Update summary
        elements.totalBarang.textContent = barang.length;
        elements.totalBaik.textContent = barang.filter(b => b.kondisi === 'Baik').length;
        elements.totalRusakRingan.textContent = barang.filter(b => b.kondisi === 'Rusak Ringan').length;
        elements.totalRusakBerat.textContent = barang.filter(b => b.kondisi === 'Rusak Berat').length;
        
        // Update recent mutasi
        updateRecentMutasi(mutasi.slice(-5).reverse());
        
        // Update charts
        updateCharts(barang);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        alert('Gagal memuat data dashboard: ' + error.message);
    }
}

// Update recent mutasi table
function updateRecentMutasi(mutasi) {
    elements.recentMutasi.innerHTML = '';
    
    if (mutasi.length === 0) {
        elements.recentMutasi.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data mutasi</td></tr>';
        return;
    }
    
    mutasi.forEach(m => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(m.tanggal)}</td>
            <td>${getBarangName(m.id_barang)}</td>
            <td>${m.dari}</td>
            <td>${m.ke}</td>
            <td>${m.oleh}</td>
        `;
        elements.recentMutasi.appendChild(row);
    });
}

// Get barang name by ID
function getBarangName(id) {
    const barang = state.barang.find(b => b.id === id);
    return barang ? barang.nama : 'Unknown';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID');
}

// Update charts
function updateCharts(barang) {
    // Kategori chart
    const kategoriCount = {};
    barang.forEach(b => {
        kategoriCount[b.kategori] = (kategoriCount[b.kategori] || 0) + 1;
    });
    
    const kategoriCtx = document.getElementById('kategoriChart').getContext('2d');
    new Chart(kategoriCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(kategoriCount),
            datasets: [{
                label: 'Jumlah Barang',
                data: Object.values(kategoriCount),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Lokasi chart
    const lokasiCount = {};
    barang.forEach(b => {
        lokasiCount[b.lokasi] = (lokasiCount[b.lokasi] || 0) + 1;
    });
    
    const lokasiCtx = document.getElementById('lokasiChart').getContext('2d');
    new Chart(lokasiCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(lokasiCount),
            datasets: [{
                label: 'Jumlah Barang',
                data: Object.values(lokasiCount),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true
        }
    });
}

// Load data barang
async function loadBarangData() {
    try {
        state.barang = await apiCall('barang', 'list');
        state.filteredBarang = [...state.barang];
        
        // Update filters
        updateBarangFilters();
        
        // Render table
        renderBarangTable();
        
    } catch (error) {
        console.error('Error loading barang data:', error);
        alert('Gagal memuat data barang: ' + error.message);
    }
}

// Update filter options
function updateBarangFilters() {
    // Kategori filter
    const kategori = [...new Set(state.barang.map(b => b.kategori))];
    elements.filterKategori.innerHTML = '<option value="">Semua Kategori</option>';
    kategori.forEach(k => {
        elements.filterKategori.innerHTML += `<option value="${k}">${k}</option>`;
    });
    
    // Lokasi filter
    const lokasi = [...new Set(state.barang.map(b => b.lokasi))];
    elements.filterLokasi.innerHTML = '<option value="">Semua Lokasi</option>';
    lokasi.forEach(l => {
        elements.filterLokasi.innerHTML += `<option value="${l}">${l}</option>`;
    });
}

// Filter barang
function filterBarang() {
    const searchTerm = elements.searchBarang.value.toLowerCase();
    const kategori = elements.filterKategori.value;
    const kondisi = elements.filterKondisi.value;
    const lokasi = elements.filterLokasi.value;
    
    state.filteredBarang = state.barang.filter(b => {
        return (
            (b.nama.toLowerCase().includes(searchTerm) || 
             b.kategori.toLowerCase().includes(searchTerm) ||
             b.merk?.toLowerCase().includes(searchTerm) ||
             b.tipe?.toLowerCase().includes(searchTerm)) &&
            (kategori === '' || b.kategori === kategori) &&
            (kondisi === '' || b.kondisi === kondisi) &&
            (lokasi === '' || b.lokasi === lokasi)
        );
    });
    
    state.currentBarangPage = 1;
    renderBarangTable();
}

// Reset filters
function resetBarangFilters() {
    elements.searchBarang.value = '';
    elements.filterKategori.value = '';
    elements.filterKondisi.value = '';
    elements.filterLokasi.value = '';
    
    state.filteredBarang = [...state.barang];
    state.currentBarangPage = 1;
    renderBarangTable();
}

// Render barang table
function renderBarangTable() {
    const startIndex = (state.currentBarangPage - 1) * CONFIG.itemsPerPage;
    const endIndex = startIndex + CONFIG.itemsPerPage;
    const paginatedBarang = state.filteredBarang.slice(startIndex, endIndex);
    
    elements.barangTableBody.innerHTML = '';
    
    if (paginatedBarang.length === 0) {
        elements.barangTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data barang</td></tr>';
        elements.barangPagination.innerHTML = '';
        return;
    }
    
    paginatedBarang.forEach(barang => {
        const row = document.createElement('tr');
        
        // Determine badge class based on condition
        let badgeClass = 'badge-baik';
        if (barang.kondisi === 'Rusak Ringan') badgeClass = 'badge-rusak-ringan';
        if (barang.kondisi === 'Rusak Berat') badgeClass = 'badge-rusak-berat';
        
        row.innerHTML = `
            <td>${barang.nama}</td>
            <td>${barang.kategori}</td>
            <td>${barang.merk || ''} ${barang.tipe || ''}</td>
            <td>${barang.lokasi}</td>
            <td><span class="badge ${badgeClass}">${barang.kondisi}</span></td>
            <td>${barang.penanggung_jawab || '-'}</td>
            <td>
                <button class="btn btn-sm btn-info view-barang" data-id="${barang.id}" title="Lihat Detail">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning edit-barang" data-id="${barang.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-barang" data-id="${barang.id}" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        elements.barangTableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.view-barang').forEach(btn => {
        btn.addEventListener('click', () => viewBarang(btn.getAttribute('data-id')));
    });
    
    document.querySelectorAll('.edit-barang').forEach(btn => {
        btn.addEventListener('click', () => editBarang(btn.getAttribute('data-id')));
    });
    
    document.querySelectorAll('.delete-barang').forEach(btn => {
        btn.addEventListener('click', () => deleteBarang(btn.getAttribute('data-id')));
    });
    
    // Render pagination
    renderPagination('barang', state.filteredBarang.length);
}

// Render pagination
function renderPagination(type, totalItems) {
    const totalPages = Math.ceil(totalItems / CONFIG.itemsPerPage);
    const paginationElement = type === 'barang' ? elements.barangPagination : elements.mutasiPagination;
    const currentPage = type === 'barang' ? state.currentBarangPage : state.currentMutasiPage;
    
    paginationElement.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>`;
    paginationElement.appendChild(prevLi);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
        paginationElement.appendChild(li);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>`;
    paginationElement.appendChild(nextLi);
    
    // Add event listeners
    paginationElement.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(link.getAttribute('data-page'));
            
            if (type === 'barang') {
                state.currentBarangPage = page;
                renderBarangTable();
            } else {
                state.currentMutasiPage = page;
                renderMutasiTable();
            }
        });
    });
}

// View barang detail
async function viewBarang(id) {
    try {
        const barang = await apiCall('barang', 'get', null, id);
        const mutasi = await apiCall('mutasi', 'list', null, {id_barang: id});
        
        // Update detail modal
        document.getElementById('detail-nama').textContent = barang.nama;
        document.getElementById('detail-kategori').textContent = barang.kategori;
        document.getElementById('detail-merk-tipe').textContent = `${barang.merk || ''} ${barang.tipe || ''}`.trim();
        document.getElementById('detail-tahun').textContent = barang.tahun_perolehan || '-';
        document.getElementById('detail-harga').textContent = barang.harga_perolehan ? `Rp ${parseInt(barang.harga_perolehan).toLocaleString('id-ID')}` : '-';
        document.getElementById('detail-lokasi').textContent = barang.lokasi;
        
        // Condition badge
        let badgeClass = 'badge-baik';
        if (barang.kondisi === 'Rusak Ringan') badgeClass = 'badge-rusak-ringan';
        if (barang.kondisi === 'Rusak Berat') badgeClass = 'badge-rusak-berat';
        
        document.getElementById('detail-kondisi').innerHTML = `<span class="badge ${badgeClass}">${barang.kondisi}</span>`;
        document.getElementById('detail-status').textContent = barang.status;
        document.getElementById('detail-penanggung-jawab').textContent = barang.penanggung_jawab || '-';
        document.getElementById('detail-catatan').textContent = barang.catatan || '-';
        
        // Update mutasi history
        const mutasiBody = document.getElementById('detail-mutasi');
        mutasiBody.innerHTML = '';
        
        if (mutasi.length === 0) {
            mutasiBody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada riwayat mutasi</td></tr>';
        } else {
            mutasi.forEach(m => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formatDate(m.tanggal)}</td>
                    <td>${m.dari}</td>
                    <td>${m.ke}</td>
                    <td>${m.oleh}</td>
                    <td>${m.keterangan || '-'}</td>
                `;
                mutasiBody.appendChild(row);
            });
        }
        
        // Show modal
        const detailModal = new bootstrap.Modal(document.getElementById('detailModal'));
        detailModal.show();
        
    } catch (error) {
        console.error('Error viewing barang:', error);
        alert('Gagal memuat detail barang: ' + error.message);
    }
}

// Edit barang
async function editBarang(id) {
    try {
        const barang = await apiCall('barang', 'get', null, id);
        
        // Fill form
        document.getElementById('barangModalTitle').textContent = 'Edit Barang';
        document.getElementById('barang-id').value = barang.id;
        document.getElementById('nama').value = barang.nama;
        document.getElementById('kategori').value = barang.kategori;
        document.getElementById('merk').value = barang.merk || '';
        document.getElementById('tipe').value = barang.tipe || '';
        document.getElementById('tahun_perolehan').value = barang.tahun_perolehan || '';
        document.getElementById('sumber_perolehan').value = barang.sumber_perolehan || '';
        document.getElementById('harga_perolehan').value = barang.harga_perolehan || '';
        document.getElementById('lokasi').value = barang.lokasi;
        document.getElementById('kondisi').value = barang.kondisi;
        document.getElementById('status').value = barang.status;
        document.getElementById('penanggung_jawab').value = barang.penanggung_jawab || '';
        document.getElementById('foto_url').value = barang.foto_url || '';
        document.getElementById('catatan').value = barang.catatan || '';
        
        // Show modal
        const barangModal = new bootstrap.Modal(document.getElementById('barangModal'));
        barangModal.show();
        
    } catch (error) {
        console.error('Error editing barang:', error);
        alert('Gagal memuat data barang: ' + error.message);
    }
}

// Delete barang
async function deleteBarang(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
        return;
    }
    
    try {
        await apiCall('barang', 'delete', null, id);
        alert('Barang berhasil dihapus');
        loadBarangData();
        loadDashboardData(); // Refresh dashboard stats
    } catch (error) {
        console.error('Error deleting barang:', error);
        alert('Gagal menghapus barang: ' + error.message);
    }
}

// Save barang (create or update)
async function saveBarang() {
    const form = elements.barangForm;
    
    // Validate form
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    const id = document.getElementById('barang-id').value;
    const isEdit = !!id;
    
    const data = {
        nama: document.getElementById('nama').value,
        kategori: document.getElementById('kategori').value,
        merk: document.getElementById('merk').value,
        tipe: document.getElementById('tipe').value,
        tahun_perolehan: document.getElementById('tahun_perolehan').value || null,
        sumber_perolehan: document.getElementById('sumber_perolehan').value || null,
        harga_perolehan: document.getElementById('harga_perolehan').value || null,
        lokasi: document.getElementById('lokasi').value,
        kondisi: document.getElementById('kondisi').value,
        status: document.getElementById('status').value,
        penanggung_jawab: document.getElementById('penanggung_jawab').value || null,
        foto_url: document.getElementById('foto_url').value || null,
        catatan: document.getElementById('catatan').value || null
    };
    
    try {
        if (isEdit) {
            await apiCall('barang', 'update', data, id);
            alert('Barang berhasil diupdate');
        } else {
            await apiCall('barang', 'create', data);
            alert('Barang berhasil ditambahkan');
        }
        
        // Close modal and refresh data
        const barangModal = bootstrap.Modal.getInstance(document.getElementById('barangModal'));
        barangModal.hide();
        
        loadBarangData();
        loadDashboardData(); // Refresh dashboard stats
        
    } catch (error) {
        console.error('Error saving barang:', error);
        alert('Gagal menyimpan barang: ' + error.message);
    }
}

// Reset barang form
function resetBarangForm() {
    elements.barangForm.reset();
    elements.barangForm.classList.remove('was-validated');
    document.getElementById('barangModalTitle').textContent = 'Tambah Barang';
    document.getElementById('barang-id').value = '';
}

// Load data mutasi
async function loadMutasiData() {
    try {
        state.mutasi = await apiCall('mutasi', 'list');
        renderMutasiTable();
    } catch (error) {
        console.error('Error loading mutasi data:', error);
        alert('Gagal memuat data mutasi: ' + error.message);
    }
}

// Render mutasi table
function renderMutasiTable() {
    const startIndex = (state.currentMutasiPage - 1) * CONFIG.itemsPerPage;
    const endIndex = startIndex + CONFIG.itemsPerPage;
    const paginatedMutasi = state.mutasi.slice(startIndex, endIndex).reverse();
    
    elements.mutasiTableBody.innerHTML = '';
    
    if (paginatedMutasi.length === 0) {
        elements.mutasiTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada data mutasi</td></tr>';
        elements.mutasiPagination.innerHTML = '';
        return;
    }
    
    paginatedMutasi.forEach(mutasi => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(mutasi.tanggal)}</td>
            <td>${getBarangName(mutasi.id_barang)}</td>
            <td>${mutasi.dari}</td>
            <td>${mutasi.ke}</td>
            <td>${mutasi.oleh}</td>
            <td>${mutasi.keterangan || '-'}</td>
        `;
        elements.mutasiTableBody.appendChild(row);
    });
    
    // Render pagination
    renderPagination('mutasi', state.mutasi.length);
}

// Load barang options for mutasi form
async function loadBarangOptions() {
    try {
        const barang = await apiCall('barang', 'list');
        
        elements.idBarangMutasi.innerHTML = '<option value="">Pilih Barang</option>';
        barang.forEach(b => {
            elements.idBarangMutasi.innerHTML += `<option value="${b.id}">${b.nama} (${b.lokasi})</option>`;
        });
    } catch (error) {
        console.error('Error loading barang options:', error);
    }
}

// Save mutasi
async function saveMutasi() {
    const form = elements.mutasiForm;
    
    // Validate form
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    const data = {
        id_barang: document.getElementById('id_barang_mutasi').value,
        dari: document.getElementById('dari').value,
        ke: document.getElementById('ke').value,
        oleh: document.getElementById('oleh_mutasi').value,
        keterangan: document.getElementById('keterangan_mutasi').value || null
    };
    
    try {
        await apiCall('mutasi', 'create', data);
        
        // Update lokasi barang
        await apiCall('barang', 'update', {lokasi: data.ke}, data.id_barang);
        
        alert('Mutasi berhasil dicatat');
        
        // Close modal and refresh data
        const mutasiModal = bootstrap.Modal.getInstance(document.getElementById('mutasiModal'));
        mutasiModal.hide();
        form.reset();
        form.classList.remove('was-validated');
        
        loadMutasiData();
        loadBarangData();
        loadDashboardData(); // Refresh dashboard stats
        
    } catch (error) {
        console.error('Error saving mutasi:', error);
        alert('Gagal menyimpan mutasi: ' + error.message);
    }
}

// Load data pengguna
async function loadPenggunaData() {
    try {
        state.pengguna = await apiCall('pengguna', 'list');
        renderPenggunaTable();
    } catch (error) {
        console.error('Error loading pengguna data:', error);
        alert('Gagal memuat data pengguna: ' + error.message);
    }
}

// Render pengguna table
function renderPenggunaTable() {
    elements.penggunaTableBody.innerHTML = '';
    
    if (state.pengguna.length === 0) {
        elements.penggunaTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data pengguna</td></tr>';
        return;
    }
    
    state.pengguna.forEach(pengguna => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${pengguna.nama}</td>
            <td>${pengguna.role}</td>
            <td>${pengguna.email}</td>
            <td>${pengguna.telepon || '-'}</td>
            <td>
                <button class="btn btn-sm btn-warning edit-pengguna" data-id="${pengguna.id_user}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-pengguna" data-id="${pengguna.id_user}" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        elements.penggunaTableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.edit-pengguna').forEach(btn => {
        btn.addEventListener('click', () => editPengguna(btn.getAttribute('data-id')));
    });
    
    document.querySelectorAll('.delete-pengguna').forEach(btn => {
        btn.addEventListener('click', () => deletePengguna(btn.getAttribute('data-id')));
    });
}

// Edit pengguna
async function editPengguna(id) {
    try {
        const pengguna = await apiCall('pengguna', 'get', null, id);
        
        // Fill form
        document.getElementById('penggunaModalTitle').textContent = 'Edit Pengguna';
        document.getElementById('pengguna-id').value = pengguna.id_user;
        document.getElementById('nama_pengguna').value = pengguna.nama;
        document.getElementById('role').value = pengguna.role;
        document.getElementById('email').value = pengguna.email;
        document.getElementById('telepon').value = pengguna.telepon || '';
        
        // Show modal
        const penggunaModal = new bootstrap.Modal(document.getElementById('penggunaModal'));
        penggunaModal.show();
        
    } catch (error) {
        console.error('Error editing pengguna:', error);
        alert('Gagal memuat data pengguna: ' + error.message);
    }
}

// Delete pengguna
async function deletePengguna(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
        return;
    }
    
    try {
        await apiCall('pengguna', 'delete', null, id);
        alert('Pengguna berhasil dihapus');
        loadPenggunaData();
    } catch (error) {
        console.error('Error deleting pengguna:', error);
        alert('Gagal menghapus pengguna: ' + error.message);
    }
}

// Save pengguna (create or update)
async function savePengguna() {
    const form = elements.penggunaForm;
    
    // Validate form
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    const id = document.getElementById('pengguna-id').value;
    const isEdit = !!id;
    
    const data = {
        nama: document.getElementById('nama_pengguna').value,
        role: document.getElementById('role').value,
        email: document.getElementById('email').value,
        telepon: document.getElementById('telepon').value || null
    };
    
    try {
        if (isEdit) {
            await apiCall('pengguna', 'update', data, id);
            alert('Pengguna berhasil diupdate');
        } else {
            await apiCall('pengguna', 'create', data);
            alert('Pengguna berhasil ditambahkan');
        }
        
        // Close modal and refresh data
        const penggunaModal = bootstrap.Modal.getInstance(document.getElementById('penggunaModal'));
        penggunaModal.hide();
        form.reset();
        form.classList.remove('was-validated');
        
        loadPenggunaData();
        
    } catch (error) {
        console.error('Error saving pengguna:', error);
        alert('Gagal menyimpan pengguna: ' + error.message);
    }
}

// Export barang to CSV
function exportBarangToCSV() {
    if (state.filteredBarang.length === 0) {
        alert('Tidak ada data untuk diexport');
        return;
    }
    
    const headers = ['Nama', 'Kategori', 'Merk', 'Tipe', 'Tahun Perolehan', 'Sumber Perolehan', 'Harga Perolehan', 'Lokasi', 'Kondisi', 'Status', 'Penanggung Jawab', 'Catatan'];
    
    let csvContent = headers.join(',') + '\n';
    
    state.filteredBarang.forEach(barang => {
        const row = [
            `"${barang.name}"`,
            `"${barang.kategori}"`,
            `"${barang.merk || ''}"`,
            `"${barang.tipe || ''}"`,
            `"${barang.tahun_perolehan || ''}"`,
            `"${barang.sumber_perolehan || ''}"`,
            `"${barang.harga_perolehan || ''}"`,
            `"${barang.lokasi}"`,
            `"${barang.kondisi}"`,
            `"${barang.status}"`,
            `"${barang.penanggung_jawab || ''}"`,
            `"${barang.catatan || ''}"`
        ];
        csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'inventaris_barang.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);