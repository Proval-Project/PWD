import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface DataSheet {
  sheetID: number;
  tagNo: string;
  itemCode: string;
  sheetNo?: number;
}

const EstimateDetailPage: React.FC = () => {
  const { id } = useParams(); // 견적번호
  const [dataSheets, setDataSheets] = useState<DataSheet[]>([]);
  const [itemOrder, setItemOrder] = useState<string[]>([]); // itemCode 순서
  const [sheetIds, setSheetIds] = useState<{ [itemCode: string]: number[] }>({}); // itemCode별 SheetID 순서
  const [selectedItemCode, setSelectedItemCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // 데이터 재조회 함수
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/data/datasheet`, {
        baseURL: 'http://localhost:5162',
        params: { estimateNo: id }
      });

      setDataSheets(res.data);
      // itemCode, tagNo 순서 정보 추출
      const itemCodes = Array.from(new Set(res.data.map((d: DataSheet) => d.itemCode))) as string[];
      setItemOrder(itemCodes);
      // 최초 로딩 시 sheetIds 초기화 (SheetNo 순서로 정렬)
      const initialSheetIds: { [itemCode: string]: number[] } = {};
      itemCodes.forEach(code => {
        const rows = res.data.filter((d: DataSheet) => d.itemCode === code);
        // sheetNo 순서로 정렬 후 sheetID 추출
        rows.sort((a: DataSheet, b: DataSheet) => (a.sheetNo || 0) - (b.sheetNo || 0));
        initialSheetIds[code] = rows.map((d: DataSheet) => d.sheetID);
      });
      setSheetIds(initialSheetIds);
      if (itemCodes.length > 0 && !selectedItemCode) setSelectedItemCode(itemCodes[0] as string);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [id]);

  // SheetID 순서를 가져와서 해당하는 tagNo들을 표시용으로 변환
  const sheetIdOrder = sheetIds[selectedItemCode ?? ''] || [];
  const tagNoOrder = sheetIdOrder.map(sheetId => {
    const row = dataSheets.find(d => d.sheetID === sheetId);
    return row ? row.tagNo : '';
  }).filter(tagNo => tagNo !== '');

  // 드래그&드롭 핸들러
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.type === 'itemCode') {
      const newOrder = Array.from(itemOrder);
      const [removed] = newOrder.splice(result.source.index, 1);
      newOrder.splice(result.destination.index, 0, removed);
      setItemOrder(newOrder);
    } else if (result.type === 'tagNo') {
      const newOrder = Array.from(sheetIdOrder);
      const [removed] = newOrder.splice(result.source.index, 1);
      newOrder.splice(result.destination.index, 0, removed);
      // sheetIds에 반영
      setSheetIds(prev => ({ ...prev, [selectedItemCode!]: newOrder }));
    }
  };

  // 저장 버튼 클릭 시 SheetNo 업데이트
  const handleSaveOrder = async () => {
    if (!selectedItemCode) return;
    setSaving(true);
    try {
      let updates: { estimateNo: string; sheetID: number; SheetNo: number }[] = [];
      let sheetNo = 1;
      itemOrder.forEach(itemCode => {
        const sheetIdList = sheetIds[itemCode] || [];
        sheetIdList.forEach(sheetId => {
          // SheetID로 직접 업데이트 정보 생성
          updates.push({ estimateNo: id!, sheetID: sheetId, SheetNo: sheetNo++ });
        });
      });
      await axios.put('/api/data/datasheet/order', updates, { baseURL: 'http://localhost:5162' });
      alert('순서가 저장되었습니다.');
      await fetchData(); // 저장 후 데이터 재조회
    } catch (err: any) {
      alert('저장 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }

  };

  return (
    <div className="page-container" style={{ display: 'flex', gap: 40 }}>
      <DragDropContext onDragEnd={onDragEnd}>
        {/* 좌측: ItemCode 리스트 드래그&드롭 (최소 예제) */}
        <Droppable droppableId="itemCode-droppable" type="itemCode">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} style={{ minWidth: 120 }}>
              <h3>Itemcode list</h3>
              {itemOrder.length === 0 ? (
                <div>없음</div>
              ) : (
                <div>
                  {itemOrder.map((code, idx) => (
                    <Draggable key={code} draggableId={code} index={idx}>
                      {(prov) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          style={{
                            userSelect: 'none',
                            padding: 16,
                            margin: '0 0 8px 0',
                            minHeight: '50px',
                            backgroundColor: selectedItemCode === code ? '#456C86' : '#ccc',
                            color: 'white',
                            fontWeight: selectedItemCode === code ? 'bold' : 'normal',
                            fontSize: 20,
                            borderRadius: 6,
                            border: '1px solid #888',
                            cursor: 'grab',
                            ...prov.draggableProps.style
                          }}
                          onClick={() => setSelectedItemCode(code)}
                        >
                          {code}{selectedItemCode === code ? ' (클릭)' : ''}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </div>
          )}
        </Droppable>
        {/* 우측: TagNo 리스트 드래그&드롭 (최소 예제) */}
        <Droppable droppableId="tagNo-droppable" type="tagNo">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} style={{ minWidth: 200 }}>
              <h3>TagNo List</h3>
              {selectedItemCode === null ? (
                <div>ItemCode를 선택하세요.</div>
              ) : tagNoOrder.length === 0 ? (
                <div>TagNo 없음</div>
              ) : (
                <div>
                  {sheetIdOrder.map((sheetId, idx) => {
                    const row = dataSheets.find(d => d.sheetID === sheetId);
                    const tagNo = row ? row.tagNo : '';
                    return (
                      <Draggable key={sheetId} draggableId={String(sheetId)} index={idx}>
                        {(prov) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            style={{
                              userSelect: 'none',
                              padding: 16,
                              margin: '0 0 8px 0',
                              minHeight: '40px',
                              backgroundColor: '#888',
                              color: 'white',
                              fontSize: 18,
                              borderRadius: 6,
                              border: '1px solid #888',
                              cursor: 'grab',
                              ...prov.draggableProps.style
                            }}
                            onClick={() => alert(`TagNo 상세: ${tagNo} (sheetID: ${sheetId})`)}
                          >
                            {tagNo}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <div style={{ alignSelf: 'flex-start', marginTop: 32 }}>
        <button onClick={handleSaveOrder} disabled={saving} style={{ fontSize: 16, padding: '8px 24px' }}>
          {saving ? '저장 중...' : '순서 저장'}
        </button>
      </div>
    </div>
  );
};

export default EstimateDetailPage;
