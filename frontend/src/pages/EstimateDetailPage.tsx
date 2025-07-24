import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface DataSheet {
  SheetID: number;
  tagNo: string;
  itemCode: string;
  SheetNo?: number;
}

const EstimateDetailPage: React.FC = () => {
  const { id } = useParams(); // 견적번호
  const [dataSheets, setDataSheets] = useState<DataSheet[]>([]);
  const [itemOrder, setItemOrder] = useState<string[]>([]); // itemCode 순서
  const [tagOrder, setTagOrder] = useState<string[]>([]); // tagNo 순서(선택된 itemCode)
  const [selectedItemCode, setSelectedItemCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
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
        if (itemCodes.length > 0 && !selectedItemCode) setSelectedItemCode(itemCodes[0] as string);
      } catch (err: any) {
        setError(err.response?.data?.message || '데이터를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, [id]);

  // tagOrder는 선택된 itemCode가 바뀔 때마다 갱신
  useEffect(() => {
    if (!selectedItemCode) return;
    const tags = dataSheets.filter(d => d.itemCode === selectedItemCode).map(d => d.tagNo);
    setTagOrder(tags);
  }, [selectedItemCode, dataSheets]);

  // 드래그&드롭 핸들러
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.type === 'itemCode') {
      const newOrder = Array.from(itemOrder);
      const [removed] = newOrder.splice(result.source.index, 1);
      newOrder.splice(result.destination.index, 0, removed);
      setItemOrder(newOrder);
    } else if (result.type === 'tagNo') {
      const newOrder = Array.from(tagOrder);
      const [removed] = newOrder.splice(result.source.index, 1);
      newOrder.splice(result.destination.index, 0, removed);
      setTagOrder(newOrder);
    }
  };

  // 저장 버튼 클릭 시 SheetNo 업데이트
  const handleSaveOrder = async () => {
    if (!selectedItemCode) return;
    setSaving(true);
    try {
      // itemCode 순서 업데이트
      let updates: { SheetID: number; SheetNo: number }[] = [];
      // itemCode별로 tagNo 순서도 업데이트
      itemOrder.forEach((itemCode, i) => {
        const tags = itemCode === selectedItemCode ? tagOrder : dataSheets.filter(d => d.itemCode === itemCode).map(d => d.tagNo);
        tags.forEach((tagNo, j) => {
          const row = dataSheets.find(d => d.itemCode === itemCode && d.tagNo === tagNo);
          if (row) {
            updates.push({ SheetID: row.SheetID, SheetNo: j + 1 });
          }
        });
      });
      await axios.put('/api/data/datasheet/order', updates, { baseURL: 'http://localhost:5162' });
      alert('순서가 저장되었습니다.');
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
              ) : tagOrder.length === 0 ? (
                <div>TagNo 없음</div>
              ) : (
                <div>
                  {tagOrder.map((tag, idx) => (
                    <Draggable key={tag} draggableId={tag} index={idx}>
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
                          onClick={() => alert(`TagNo 상세: ${tag}`)}
                        >
                          {tag}
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
