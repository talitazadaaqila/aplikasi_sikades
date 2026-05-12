import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lmylclcixaondhxnrixh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxteWxjbGNpeGFvbmRoeG5yaXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NzIzOTksImV4cCI6MjA5MjI0ODM5OX0.qnjYsGnvxmAvzsSY6x6I02s5DnRMzmtoXHafKT0UwBA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing insert...');
  const { data: insertData, error: insertError } = await supabase
    .from('pemasukan')
    .insert([
      {
        tanggal: '2026-04-30',
        sumber: 'Test',
        jumlah: 1000,
        keterangan: 'Test'
      }
    ])
    .select();

  console.log('Insert Error:', insertError);
  console.log('Insert Data:', insertData);

  console.log('Testing select...');
  const { data: selectData, error: selectError } = await supabase
    .from('pemasukan')
    .select('*');

  console.log('Select Error:', selectError);
  console.log('Select Data:', selectData);
}

test();
