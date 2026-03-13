const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let history = JSON.parse(localStorage.getItem('endeksHistory')) || [];

function saveToHistory(endeks) {
    const now = new Date();
    // Tarih ve Saat formatı: 03.03.24 - 21:15
    const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const fullStamp = `${dateStr} - ${timeStr}`;
    
    if (history.length > 0 && history[0].val === endeks) return;

    history.unshift({ id: Date.now(), date: fullStamp, val: endeks });
    if (history.length > 10) history.pop();
    
    localStorage.setItem('endeksHistory', JSON.stringify(history));
}

function renderHistory() {
    const list = document.getElementById('historyList');
    list.innerHTML = history.length === 0 ? '<p style="text-align:center; color:gray; padding:20px;">Kayıt bulunamadı.</p>' : '';
    
    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-info">
                <span class="history-date">${item.date}</span>
                <span class="history-val">${item.val} kWh</span>
            </div>
            <div class="history-actions">
                <button class="action-btn copy" onclick="copyToInput('${item.val}')" title="Kopyala">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
                <button class="action-btn delete" onclick="removeFromHistory(${item.id})" title="Sil">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
            </div>
        `;
        list.appendChild(div);
    });
}

window.copyToInput = (val) => {
    document.getElementById('araIlkEndeks').value = val;
    document.getElementById('historyModal').classList.add('hidden');
};

window.removeFromHistory = (id) => {
    history = history.filter(item => item.id !== id);
    localStorage.setItem('endeksHistory', JSON.stringify(history));
    renderHistory();
};

document.getElementById('historyBtn').addEventListener('click', () => {
    renderHistory();
    document.getElementById('historyModal').classList.remove('hidden');
});

document.getElementById('closeHistory').addEventListener('click', () => {
    document.getElementById('historyModal').classList.add('hidden');
});

document.getElementById('pdfUpload').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const status = document.getElementById('status');
    status.innerText = "İşleniyor...";
    
    const reader = new FileReader();
    reader.onload = async function() {
        try {
            const typedarray = new Uint8Array(this.result);
            const pdf = await pdfjsLib.getDocument({data: typedarray}).promise;
            const page = await pdf.getPage(1);
            const textContent = await page.getTextContent();
            const fullText = textContent.items.map(s => s.str).join(" ").replace(/\s+/g, ' ');

            const tutarMatch = fullText.match(/ÖDENECEK\s*TUTAR\s*.*?([\d\.]+(,\d{2}))/i);
            const kwhMatch = fullText.match(/Enerji\s*Tük\.\s*Bedeli.*?([\d\.]+(,\d{3}))/i);

            if (tutarMatch) document.getElementById('toplamFatura').value = tutarMatch[1].replace(/\./g, '').replace(',', '.');
            if (kwhMatch) document.getElementById('toplamKwh').value = kwhMatch[1].replace(/\./g, '').replace(',', '.');

            status.innerText = "Fatura değerleri başarıyla dolduruldu ✓";
            status.style.color = "#10b981";
        } catch (e) {
            status.innerText = "PDF okunamadı.";
            status.style.color = "#ef4444";
        }
    };
    reader.readAsArrayBuffer(file);
});

document.getElementById('calculateBtn').addEventListener('click', () => {
    const fTutar = parseFloat(document.getElementById('toplamFatura').value);
    const fKwh = parseFloat(document.getElementById('toplamKwh').value);
    const aIlk = parseFloat(document.getElementById('araIlkEndeks').value);
    const aSon = parseFloat(document.getElementById('araSonEndeks').value);

    if (!isNaN(fTutar) && !isNaN(fKwh) && !isNaN(aIlk) && !isNaN(aSon)) {
        saveToHistory(aSon.toString());
        
        const aTuketim = aSon - aIlk;
        const sonuc = (fTutar / fKwh) * aTuketim;

        document.getElementById('araSayacBorc').innerText = "₺" + sonuc.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        document.getElementById('araTuketimBilgi').innerText = `Tüketim: ${aTuketim.toFixed(3)} kWh`;
        
        const resultCard = document.getElementById('resultCard');
        resultCard.classList.remove('hidden');
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        alert("Lütfen tüm alanları doldurun.");
    }
});

