import React, { useState, useEffect } from 'react';
import { 
  getStatisticsSummary, 
  getStatusDistribution, 
  getMonthlyOrderStatistics, 
  getValveRatioStatistics, 
  getConversionRateStatistics,
  type StatisticsSummaryDto,
  type StatusDistributionDto,
  type MonthlyOrderDto,
  type ValveRatioDto,
  type ConversionRateDto
} from '../../api/statistics';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import './StatisticsPage.css';
import './DashboardPages.css';

// 밸브 타입 인터페이스
interface BodyValveListItem {
  valveSeriesCode: string;
  valveSeries: string;
}

// 탭 메뉴 컴포넌트
const TabMenu: React.FC<{ active: 'workflow' | 'product'; onSelect: (tab: 'workflow' | 'product') => void }> = ({ active, onSelect }) => {
  return (
    <div className="statistics-tab-menu">
      <button
        className={`statistics-tab ${active === 'workflow' ? 'active' : ''}`}
        onClick={() => onSelect('workflow')}
      >
        업무 통계
      </button>
      <button
        className={`statistics-tab ${active === 'product' ? 'active' : ''}`}
        onClick={() => onSelect('product')}
      >
        제품 통계
      </button>
    </div>
  );
};

// 상태 카드 리스트 컴포넌트
const StatusCardList: React.FC<{ data: StatisticsSummaryDto }> = ({ data }) => {
  const cards = [
    { label: '견적요청', value: data.input, color: '#007bff' },
    { label: '견적처리중', value: data.waiting, color: '#ffc107' },
    { label: '견적완료', value: data.completed, color: '#28a745' },
    { label: '주문', value: data.ordered, color: '#dc3545' }
  ];

  return (
    <div className="status-card-list">
      {cards.map((card, index) => (
        <div key={index} className="status-card" style={{ borderLeft: `4px solid ${card.color}` }}>
          <div className="status-card-label">{card.label}</div>
          <div className="status-card-value">{card.value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
};

// 날짜 범위 선택기 컴포넌트
const DateRangePicker: React.FC<{
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
}> = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
  return (
    <div className="date-range-picker">
      <label>기간 선택:</label>
      <DatePicker
        selected={startDate}
        onChange={(date: Date | null) => {
          if (date) onStartDateChange(date);
        }}
        selectsStart
        startDate={startDate}
        endDate={endDate}
        dateFormat="yyyy-MM-dd"
        className="date-picker-input"
      />
      <span> ~ </span>
      <DatePicker
        selected={endDate}
        onChange={(date: Date | null) => {
          if (date) onEndDateChange(date);
        }}
        selectsEnd
        startDate={startDate}
        endDate={endDate}
        minDate={startDate}
        dateFormat="yyyy-MM-dd"
        className="date-picker-input"
      />
    </div>
  );
};

// 밸브 타입 선택기 컴포넌트
const ValveTypeSelector: React.FC<{
  valveTypes: BodyValveListItem[];
  selectedValveType: string | null;
  onValveTypeChange: (valveType: string | null) => void;
}> = ({ valveTypes, selectedValveType, onValveTypeChange }) => {
  return (
    <div className="valve-type-selector">
      <label>밸브 종류:</label>
      <select
        value={selectedValveType || ''}
        onChange={(e) => onValveTypeChange(e.target.value || null)}
        className="valve-type-select"
      >
        <option value="">전체</option>
        {valveTypes.map((valve) => (
          <option key={valve.valveSeriesCode} value={valve.valveSeriesCode}>
            {valve.valveSeries}
          </option>
        ))}
      </select>
    </div>
  );
};

// 상태 분포 차트 컴포넌트
const StatusDistributionChart: React.FC<{ data: StatusDistributionDto }> = ({ data }) => {
  const chartData = [
    { name: '견적요청', value: data.input },
    { name: '견적처리중', value: data.waiting },
    { name: '견적완료', value: data.completed },
    { name: '주문', value: data.ordered }
  ];

  const COLORS = ['#007bff', '#ffc107', '#28a745', '#dc3545'];

  return (
    <div className="chart-container">
      <h3>상태 분포</h3>
      <div className="chart-row">
        <div className="chart-item">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: '건 수', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#007bff" name="건수" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-item">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// 전환율 혼합 차트 컴포넌트
const ConversionRateComposedChart: React.FC<{ data: ConversionRateDto[] }> = ({ data }) => {
  // 범례 순서를 명시적으로 제어하는 커스텀 렌더러
  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    if (!payload) return null;

    // 원하는 순서대로 정렬: 전체 요청, 완료, 주문, 전환율 (%)
    const orderMap: { [key: string]: number } = {
      '전체 요청': 0,
      '완료': 1,
      '주문': 2,
      '전환율 (%)': 3
    };

    const sortedPayload = [...payload].sort((a, b) => {
      const orderA = orderMap[a.value] !== undefined ? orderMap[a.value] : 999;
      const orderB = orderMap[b.value] !== undefined ? orderMap[b.value] : 999;
      return orderA - orderB;
    });

    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
        {sortedPayload.map((entry: any, index: number) => (
          <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', margin: '0 10px', marginBottom: '5px' }}>
            {entry.type === 'line' ? (
              <svg width="20" height="20" style={{ marginRight: '5px' }}>
                <line x1="0" y1="10" x2="20" y2="10" stroke={entry.color} strokeWidth="2" />
                <circle cx="10" cy="10" r="3" fill={entry.color} />
              </svg>
            ) : (
              <span
                style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  backgroundColor: entry.color,
                  marginRight: '5px'
                }}
              />
            )}
            <span>{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="chart-container">
      <h3>전환율 추이</h3>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" label={{ value: '건수', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: '전환율 (%)', angle: 90, position: 'insideRight' }} domain={[0, 100]} />
          <Tooltip />
          <Legend content={renderCustomLegend} />
          <Bar yAxisId="left" dataKey="totalRequests" fill="#8884d8" name="전체 요청" />
          <Bar yAxisId="left" dataKey="completedQuotes" fill="#82ca9d" name="완료" />
          <Bar yAxisId="left" dataKey="actualOrders" fill="#1e40af" name="주문" />
          <Line yAxisId="right" type="monotone" dataKey="conversionRate" stroke="#ff7300" name="전환율 (%)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// 밸브 사양 비율 테이블 컴포넌트
const ValveSpecTable: React.FC<{ data: ValveRatioDto[] }> = ({ data }) => {
  return (
    <div className="valve-spec-table-container">
      <h3>밸브 사양 비율</h3>
      <table className="valve-spec-table">
        <thead>
          <tr>
            <th>밸브 타입</th>
            <th>건수</th>
            <th>비율 (%)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.valveTypeName || item.valveType}</td>
              <td>{item.count.toLocaleString()}</td>
              <td>{item.percentage.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 밸브 사양 비율 도넛 차트 컴포넌트
const ValveRatioDonutChart: React.FC<{ data: ValveRatioDto[] }> = ({ data }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  // Recharts가 기대하는 형식으로 변환
  const chartData = data.map(item => ({
    name: item.valveTypeName || item.valveType,
    value: item.count,
    percentage: item.percentage
  }));

  return (
    <div className="chart-container">
      <h3>밸브 사양 비율</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry: any) => {
              const percentage = entry.percentage !== undefined ? entry.percentage : (entry.percent ? entry.percent * 100 : 0);
              return `${entry.name}: ${percentage.toFixed(1)}%`;
            }}
            outerRadius={80}
            innerRadius={40}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any, name: any, props: any) => {
            const percentage = props.payload?.percentage !== undefined 
              ? props.payload.percentage 
              : (props.payload?.percent ? props.payload.percent * 100 : 0);
            return [`${value}건 (${percentage.toFixed(1)}%)`, name];
          }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// 월별 수주 현황 막대 차트 컴포넌트
const MonthlyOrderChart: React.FC<{ data: MonthlyOrderDto[] }> = ({ data }) => {
  return (
    <div className="chart-container">
      <h3>월별 수주 현황</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#007bff" name="수주 건수" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const StatisticsPage: React.FC = () => {
  // 탭 상태
  const [activeTab, setActiveTab] = useState<'workflow' | 'product'>('workflow');

  // 날짜 범위 상태 (기본값: 현재 월)
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const [startDate, setStartDate] = useState<Date>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<Date>(lastDayOfMonth);

  // 밸브 타입 필터 (Product 탭용)
  const [selectedValveType, setSelectedValveType] = useState<string | null>(null);
  const [bodyValveList, setBodyValveList] = useState<BodyValveListItem[]>([]);

  // 데이터 상태
  const [summaryData, setSummaryData] = useState<StatisticsSummaryDto | null>(null);
  const [statusDistributionData, setStatusDistributionData] = useState<StatusDistributionDto | null>(null);
  const [monthlyOrderData, setMonthlyOrderData] = useState<MonthlyOrderDto[]>([]);
  const [valveRatioData, setValveRatioData] = useState<ValveRatioDto[]>([]);
  const [conversionRateData, setConversionRateData] = useState<ConversionRateDto[]>([]);

  // 로딩 상태
  const [loading, setLoading] = useState<boolean>(false);

  // BodyValveList 가져오기
  useEffect(() => {
    const fetchBodyValveList = async () => {
      try {
        const response = await axios.get('/api/estimate/body-valve-list');
        setBodyValveList(response.data || []);
      } catch (error) {
        console.error('BodyValveList 가져오기 실패:', error);
      }
    };
    fetchBodyValveList();
  }, []);

  // 요약 데이터 가져오기
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await getStatisticsSummary();
        setSummaryData(data);
      } catch (error) {
        console.error('요약 데이터 가져오기 실패:', error);
      }
    };
    fetchSummary();
  }, []);

  // Workflow 탭 데이터 가져오기
  useEffect(() => {
    if (activeTab === 'workflow') {
      const fetchWorkflowData = async () => {
        setLoading(true);
        try {
          const [distribution, conversion] = await Promise.all([
            getStatusDistribution(startDate, endDate),
            getConversionRateStatistics(startDate, endDate)
          ]);
          setStatusDistributionData(distribution);
          setConversionRateData(conversion);
        } catch (error) {
          console.error('Workflow 데이터 가져오기 실패:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchWorkflowData();
    }
  }, [activeTab, startDate, endDate]);

  // Product 탭 데이터 가져오기
  useEffect(() => {
    if (activeTab === 'product') {
      const fetchProductData = async () => {
        setLoading(true);
        try {
          const [monthly, valveRatio] = await Promise.all([
            getMonthlyOrderStatistics(startDate, endDate, selectedValveType),
            getValveRatioStatistics(startDate, endDate, null)
          ]);
          setMonthlyOrderData(monthly);
          setValveRatioData(valveRatio);
        } catch (error) {
          console.error('Product 데이터 가져오기 실패:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchProductData();
    }
  }, [activeTab, startDate, endDate, selectedValveType]);

  return (
    <div className="dashboard-page">
    <div className="page">
      <h1>📊 통계 분석</h1>

        {/* 탭 메뉴 */}
        <TabMenu active={activeTab} onSelect={setActiveTab} />

        {/* 상단 요약 카드 (Workflow 탭 전용) */}
        {activeTab === 'workflow' && summaryData && (
          <StatusCardList data={summaryData} />
        )}

        {/* 날짜 범위 선택기 */}
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        {/* 로딩 인디케이터 */}
        {loading && (
          <div className="loading-indicator">데이터를 불러오는 중...</div>
        )}

        {/* Workflow 탭 내용 */}
        {activeTab === 'workflow' && !loading && (
          <div className="workflow-tab-content">
            {statusDistributionData && (
              <StatusDistributionChart data={statusDistributionData} />
            )}
            {conversionRateData.length > 0 && (
              <ConversionRateComposedChart data={conversionRateData} />
            )}
          </div>
        )}

        {/* Product 탭 내용 */}
        {activeTab === 'product' && !loading && (
          <div className="product-tab-content">
            <div className="product-chart-row">
              <ValveSpecTable data={valveRatioData} />
              <ValveRatioDonutChart data={valveRatioData} />
            </div>
            
            {/* 밸브 타입 선택기를 여기로 이동 */}
            <div style={{ marginTop: '20px', marginBottom: '10px' }}>
              <ValveTypeSelector
                valveTypes={bodyValveList}
                selectedValveType={selectedValveType}
                onValveTypeChange={setSelectedValveType}
              />
            </div>
            
            {monthlyOrderData.length > 0 && (
              <MonthlyOrderChart data={monthlyOrderData} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsPage; 
