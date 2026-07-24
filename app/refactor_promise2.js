const fs = require('fs');
let content = fs.readFileSync('c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminPromiseList.tsx', 'utf8');

content = content.replace(/<Text style=\{styles\.statVal\}>\{stats\.published\}<\/Text>/g, "<Text style={[styles.statVal, {color: '#15803d'}]}>{stats.published}</Text>");
content = content.replace(/<Text style=\{styles\.statVal\}>\{stats\.draft\}<\/Text>/g, "<Text style={[styles.statVal, {color: '#b45309'}]}>{stats.draft}</Text>");
content = content.replace(/<Text style=\{styles\.statVal\}>\{stats\.missing\}<\/Text>/g, "<Text style={[styles.statVal, {color: '#b91c1c'}]}>{stats.missing}</Text>");

content = content.replace(/<Text style=\{styles\.statLbl\}>PUBLISHED<\/Text>/g, "<Text style={[styles.statLbl, {color: '#749c89'}]}>PUBLISHED</Text>");
content = content.replace(/<Text style=\{styles\.statLbl\}>DRAFTS<\/Text>/g, "<Text style={[styles.statLbl, {color: '#b3906a'}]}>DRAFTS</Text>");
content = content.replace(/<Text style=\{styles\.statLbl\}>MISSING<\/Text>/g, "<Text style={[styles.statLbl, {color: '#a96a6a'}]}>MISSING</Text>");

// Style the missing grid
content = content.replace(/mGrid: \{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 \},/g, "mGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },");
content = content.replace(/mCell: \{ width: \(width - 32 - 24\) \/ 4, backgroundColor: '#fdf2f2', borderWidth: 0.5, borderColor: '#fecaca', borderRadius: 8, paddingVertical: 12, alignItems: 'center' \},/g, "mCell: { width: '23%', backgroundColor: '#fffcf6', borderWidth: 1, borderColor: '#fecaca', borderRadius: 8, paddingBottom: 12, alignItems: 'center', overflow: 'hidden' },");

content = content.replace(/<TouchableOpacity[^>]*style=\{styles\.mCell\}[^>]*>\\s*<Text style=\{styles\.mDate\}>/g, "<TouchableOpacity key={date} style={styles.mCell} onPress={() => navigation.navigate('AdminPromiseEditor', { date })}><View style={{backgroundColor: '#c0392b', width: '100%', paddingVertical: 4, alignItems: 'center', marginBottom: 8}}><Text style={{color: '#fff', fontSize: 9, fontWeight: '700'}}>Jul</Text></View><Text style={styles.mDate}>");

fs.writeFileSync('c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminPromiseList.tsx', content);
