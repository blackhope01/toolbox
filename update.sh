#!/bin/bash

# Renkler
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' 

OUTPUT_FILE="list.json"

# Banner
clear
echo -e "${GREEN}"
echo "██╗   ██╗ ██████╗  ██████╗    █████╗  ████████╗███████╗"
echo "██║   ██║ ██╔══██╗ ██╔══██╗  ██╔══██╗ ╚══██╔══╝██╔════╝"
echo "██║   ██║ ██████╔╝ ██║  ██║  ███████║    ██║   █████╗"
echo "██║   ██║ ██╔═══╝  ██║  ██║  ██╔══██║    ██║   ██╔══╝"
echo "╚██████╔╝ ██║      ██████╔╝  ██║  ██║    ██║   ███████╗"
echo " ╚═════╝  ╚═╝      ╚═════╝   ╚═╝  ╚═╝    ╚═╝   ╚══════╝"
echo -e "${NC}"

# JSON Kontrol
if [ ! -f "$OUTPUT_FILE" ]; then
    echo '{"manuel": [], "pages": []}' > "$OUTPUT_FILE"
fi

# --- İŞLEM MODLARI ---

if [ "$1" == "-del" ]; then
    # SİLME MODU
    INDEX=$2
    COUNT=$(jq '.manuel | length' "$OUTPUT_FILE")
    
    if [[ -n "$INDEX" && "$INDEX" -lt "$COUNT" && "$INDEX" -ge 0 ]]; then
        echo -e "${RED}[-] SİLİNİYOR:${NC} Manuel Index: $INDEX"
        TMP_JSON=$(jq "del(.manuel[$INDEX])" "$OUTPUT_FILE")
        echo "$TMP_JSON" > "$OUTPUT_FILE"
        echo -e "${GREEN}[✔] Kayıt başarıyla kaldırıldı.${NC}\n"
    else
        echo -e "${RED}[!] HATA:${NC} Index bulunamadı (Mevcut kayıt: $COUNT)\n"
    fi

elif [ "$#" -eq 2 ]; then
    # EKLEME MODU
    TITLE=$1
    URL=$2
    echo -e "${CYAN}[+] MANUEL EKLEME:${NC} $TITLE (${YELLOW}$URL${NC})"
    TMP_JSON=$(jq --arg t "$TITLE" --arg u "$URL" '.manuel += [{"title": $t, "path": $u}]' "$OUTPUT_FILE")
    echo "$TMP_JSON" > "$OUTPUT_FILE"
    echo -e "${GREEN}[✔] Manuel kayıt eklendi.${NC}\n"
fi

# --- OTOMATİK TARAMA ---
echo -e "${CYAN}[+] OTOMATİK TARAMA:${NC} pages/ dizini taranıyor..."

RAW_PAGES=$(find pages -maxdepth 2 -name "index.html" 2>/dev/null | while read -r path; do
    title=$(grep -oP '(?<=<title>).*?(?=</title>)' "$path" || echo "$(basename $(dirname "$path"))")
    echo -e "    ${GREEN}→${NC} Bulundu: ${BLUE}$title${NC}" >&2
    jq -n --arg t "$title" --arg p "$path" '{title: $t, path: $p}'
done | jq -s .)

if [ -z "$RAW_PAGES" ] || [ "$RAW_PAGES" == "null" ]; then
    PAGES_JSON="[]"
else
    PAGES_JSON="$RAW_PAGES"
fi

# Dosyayı güncelle
cat "$OUTPUT_FILE" | jq --argjson p "$PAGES_JSON" '.pages = $p' > "${OUTPUT_FILE}.tmp" && mv "${OUTPUT_FILE}.tmp" "$OUTPUT_FILE"

# --- ÖZET RAPOR ---
echo -e "\n${BLUE}==============================================${NC}"
echo -e "${GREEN}İŞLEM TAMAMLANDI!${NC}"
M_COUNT=$(jq '.manuel | length' "$OUTPUT_FILE")
P_COUNT=$(jq '.pages | length' "$OUTPUT_FILE")
echo -e "${CYAN}Toplam Manuel Bağlantı: ${YELLOW}$M_COUNT${NC}"
echo -e "${CYAN}Toplam Otomatik Sayfa:  ${YELLOW}$P_COUNT${NC}"
echo -e "${BLUE}==============================================${NC}"

