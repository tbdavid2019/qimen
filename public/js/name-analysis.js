(function(){
  const form=document.getElementById('nameForm'); if(!form)return;
  let mode='verify', lastRequest={};
  const byId=(id)=>document.getElementById(id), status=byId('nameStatus'), results=byId('nameResults');
  const esc=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function birthData(){const date=byId('birthDate').value;if(!date)return undefined;const time=byId('birthTime').value;return {date,sex:byId('birthSex').value,calendar:byId('birthCalendar').value,time:time||undefined,leap:byId('birthCalendar').value==='lunar'&&byId('birthLeap').checked,ziMode:byId('birthZiMode').value,allowUnknownHour:!time&&byId('unknownBirthHour').checked};}
  byId('birthCalendar').addEventListener('change',()=>{byId('birthLeapField').hidden=byId('birthCalendar').value!=='lunar';});
  document.querySelectorAll('.name-tab').forEach(btn=>btn.addEventListener('click',()=>{mode=btn.dataset.mode;document.querySelectorAll('.name-tab').forEach(b=>b.classList.toggle('active',b===btn));byId('lengthField').hidden=mode!=='generate';byId('constraintFields').hidden=mode!=='generate';byId('surname').maxLength=mode==='generate'?3:7;byId('fullName').required=mode==='verify';byId('submitName').textContent=mode==='verify'?'立即分析姓名 ➔':'立即產生命名候選 ➔';status.textContent='';results.replaceChildren();byId('nameQuestionForm').hidden=true;}));
  function renderAnalysis(r){const grids=r.fiveGrid?.values;const gridText=grids?Object.entries(grids).map(([k,v])=>`${({heaven:'天格',person:'人格',earth:'地格',outer:'外格',total:'總格'})[k]} ${v.number}（查表 ${v.lookupNumber}，${v.classification||'未分類'}，${v.element}）`).join('　｜　'):r.fiveGrid?.notice;return `<section class="name-result"><h3>${esc(r.name)}　${r.segmentation?.ambiguous?'（姓氏切分有歧義）':''}</h3><p>${r.surname?`姓：${esc(r.surname)}　名：${esc(r.givenName)}`:'請先確認姓氏切分，再查看依姓氏計算的數理。'}</p><p><b>字義與讀音</b><br>${r.characters.map(c=>`${esc(c.char)}：${esc(c.definition||'字義資料缺漏')}；${esc(c.pinyin||'讀音資料缺漏')}；${c.stroke==null?'筆畫缺漏':`${c.stroke} 畫`}；五行 ${esc(c.element||'未提供')}${c.variant?`；字庫異體提示 ${esc(c.aliasTarget||'')}`:''}`).join('<br>')}</p><p><b>五格與三才</b><br>${esc(gridText||'資料未足，未計算。')}</p><p><b>算法口徑：</b>${esc(r.profile.methodLabel)}；${esc(r.profile.description)}</p>${r.segmentation?.ambiguous?`<p>其他切分：${r.segmentation.alternatives.map(x=>`${esc(x.surname)}｜${esc(x.givenName)}`).join('、')}。建議明確填入姓氏。</p>`:''}${r.baziLens?`<p><b>八字五行對照（本地計算）：</b>喜用五行 ${esc(r.baziLens.usefulElements.join('、')||'資料未得出')}；符合字 ${esc(r.baziLens.matchingCharacters.map(c=>c.char).join('、')||'無')}。${esc(r.baziLens.notice)}</p>`:''}<p class="name-source-note">${esc(r.interpretation)}</p></section>`}
  form.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(form);const surname=fd.get('surname').trim();const birth=birthData();if(birth&&!['男','女'].includes(birth.sex)){status.textContent='填入出生日期時，請選擇排盤性別；若不提供八字參考，請清空出生日期。';return;}lastRequest={name:fd.get('name').trim(),surname:surname||undefined,profile:fd.get('profile'),birthData:birth};let endpoint='/api/name-analysis/verify',body={...lastRequest};if(mode==='generate'){endpoint='/api/name-analysis/generate';body={surname,profile:fd.get('profile'),givenNameLength:Number(fd.get('givenNameLength')),includeChars:[...byId('includeChars').value.trim()],excludeChars:[...byId('excludeChars').value.trim()],desiredElements:byId('desiredElements').value?[byId('desiredElements').value]:[],birthData:birth};delete body.name;delete body.surname;if(!surname){status.textContent='取名模式請先輸入姓氏。';return;}body.surname=surname;lastRequest={...body,mode:'generate'};}status.textContent='正在計算…';results.replaceChildren();try{const resp=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await resp.json();if(!resp.ok||!data.success)throw new Error(data.error||'計算失敗');if(mode==='verify'){results.innerHTML=renderAnalysis(data.result);}else{const rows=data.result.candidates.map(c=>renderAnalysis(c.analysis)).join('');results.innerHTML=rows||'<section class="name-result">依目前條件沒有候選，請放寬條件後再試。</section>';}status.textContent='計算完成。';byId('nameQuestionForm').hidden=false;}catch(err){status.textContent=err.message;}});
  byId('nameQuestionForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const q=byId('nameQuestion').value.trim();
    if(!q){byId('nameQuestionAnswer').textContent='請先寫下想了解的問題。';return;}
    let token = '';
    const turnstileElem = document.getElementById('name-turnstile');
    if (window.turnstile && turnstileElem) {
      try { token = window.turnstile.getResponse(turnstileElem) || ''; } catch (err) {}
    }
    const answer=byId('nameQuestionAnswer');
    answer.textContent='正在整理…';
    try{
      const resp=await fetch('/api/name-analysis-question',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...lastRequest,question:q,turnstileToken:token,'cf-turnstile-response':token})
      });
      const data=await resp.json();
      if(!resp.ok||!data.success)throw new Error(data.error||'解讀失敗');
      answer.textContent=data.analysis||'補充解讀服務未設定；上方已提供可重現的姓名分析結果。';
    }catch(err){
      answer.textContent=err.message;
    }finally{
      if (window.turnstile && turnstileElem) {
        try { window.turnstile.reset(turnstileElem); } catch (e) {}
      }
    }
  });
})();
