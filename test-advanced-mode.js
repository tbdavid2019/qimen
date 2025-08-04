const qimen = require('./lib/qimen');

console.log('=================================');
console.log('奇門遁甲進階模式測試');
console.log('=================================');

// 測試不同時間點的進階模式
const testCases = [
    { time: '2025-08-04T13:07:00', desc: '未時第1段（7分鐘）' },
    { time: '2025-08-04T13:20:00', desc: '未時第2段（20分鐘）' },
    { time: '2025-08-04T13:33:00', desc: '未時第3段（33分鐘）' },
    { time: '2025-08-04T13:47:00', desc: '未時第4段（47分鐘）' },
    { time: '2025-08-04T14:00:00', desc: '未時第5段（60分鐘）' },
    { time: '2025-08-04T14:13:00', desc: '未時第6段（73分鐘）' },
    { time: '2025-08-04T14:27:00', desc: '未時第7段（87分鐘）' },
    { time: '2025-08-04T14:40:00', desc: '未時第8段（100分鐘）' },
    { time: '2025-08-04T14:53:00', desc: '未時第9段（113分鐘）' }
];

testCases.forEach((testCase, index) => {
    const date = new Date(testCase.time);
    const result = qimen.calculate(date, { 
        method: '時家', 
        timePrecisionMode: 'advanced' 
    });

    console.log(`\n${index + 1}. ${testCase.desc}`);
    console.log(`   時間: ${testCase.time}`);
    console.log(`   時柱: ${result.siZhu.time}`);
    
    if (result.timePrecision) {
        const tp = result.timePrecision;
        console.log(`   九宮段: 第${tp.segment}段/${tp.totalSegments}段`);
        console.log(`   段時間: ${tp.segmentTime}`);
        console.log(`   段長度: ${tp.segmentDuration}分鐘`);
    }
});

console.log('\n=================================');
console.log('傳統模式 vs 進階模式對比');
console.log('=================================');

const testTime = new Date('2025-08-04T14:25:00');

console.log(`\n測試時間: ${testTime.toLocaleString()}`);

// 傳統模式
const traditionalResult = qimen.calculate(testTime, { 
    method: '時家', 
    timePrecisionMode: 'traditional' 
});

console.log('\n【傳統模式】');
console.log(`時柱: ${traditionalResult.siZhu.time}`);
console.log(`局數: ${traditionalResult.juShu.fullName}`);
console.log(`時間精度: ${traditionalResult.basicInfo.timePrecisionMode}`);

// 進階模式
const advancedResult = qimen.calculate(testTime, { 
    method: '時家', 
    timePrecisionMode: 'advanced' 
});

console.log('\n【進階模式】');
console.log(`時柱: ${advancedResult.siZhu.time}`);
console.log(`局數: ${advancedResult.juShu.fullName}`);
console.log(`時間精度: ${advancedResult.basicInfo.timePrecisionMode}`);

if (advancedResult.timePrecision) {
    const tp = advancedResult.timePrecision;
    console.log(`當前時辰: ${tp.shiGan}${tp.shichen}`);
    console.log(`九宮段數: 第${tp.segment}段/${tp.totalSegments}段`);
    console.log(`段落時間: ${tp.segmentTime}`);
    console.log(`原始時間: ${tp.originalTime}`);
}

console.log('\n測試完成！');
