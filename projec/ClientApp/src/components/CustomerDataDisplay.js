import React from 'react';
import { Card, Table } from 'react-bootstrap';

const CustomerDataDisplay = ({ data, isLoading }) => {
  const renderCustomerData = () => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div className="text-center text-muted p-3">
          고객 데이터가 없습니다.
        </div>
      );
    }

    return (
      <div>
        <h6 className="mb-3">CUSTOMER DATA (고객 데이터)</h6>
        <Table bordered size="sm">
          <tbody>
            <tr>
              <td className="fw-bold" style={{width: '30%'}}>견적번호</td>
              <td>{data?.CurEstimateNo || data?.EstimateNo || '-'}</td>
            </tr>
            <tr>
              <td className="fw-bold">회사명</td>
              <td>{data?.CustomerName || '-'}</td>
            </tr>
            <tr>
              <td className="fw-bold">요청자</td>
              <td>{data?.Requester || '-'}</td>
            </tr>
            <tr>
              <td className="fw-bold">담당자</td>
              <td>{data?.Engineer || '-'}</td>
            </tr>
          </tbody>
        </Table>
      </div>
    );
  };

  const renderFluidData = () => {
    if (!data || Object.keys(data).length === 0) {
      return null;
    }
    
    return (
      <div className="mt-4">
        <h6 className="mb-3">Fluid (유체)</h6>
        <div className="mb-3">
          <h6 className="mb-2">Properties</h6>
          <Table bordered size="sm">
            <tbody>
              <tr>
                <td className="fw-bold" style={{width: '30%'}}>Medium</td>
                <td>{data?.Medium || '-'}</td>
              </tr>
              <tr>
                <td className="fw-bold">Fluid</td>
                <td>{data?.Fluid || '-'}</td>
              </tr>
              <tr>
                <td className="fw-bold">Density</td>
                <td>{data?.Density || '-'} {data?.DensityUnit ? `(${data.DensityUnit})` : ''}</td>
              </tr>
              <tr>
                <td className="fw-bold">Molecular</td>
                <td>{data?.Molecular || '-'} {data?.MolecularWeightUnit ? `(${data.MolecularWeightUnit})` : ''}</td>
              </tr>
            </tbody>
          </Table>
        </div>
        
        <div>
          <h6 className="mb-2">Operating Conditions</h6>
          <Table bordered size="sm">
            <thead>
              <tr>
                <th>항목</th>
                <th>Max</th>
                <th>Normal</th>
                <th>Min</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>t1</td>
                <td>{data?.InletTemperatureQ ?? '-'}</td>
                <td>{data?.InletTemperatureNorQ ?? '-'}</td>
                <td>{data?.InletTemperatureMinQ ?? '-'}</td>
                <td>{data?.TemperatureUnit || '-'}</td>
              </tr>
              <tr>
                <td>p1</td>
                <td>{data?.InletPressureMaxQ ?? '-'}</td>
                <td>{data?.InletPressureNorQ ?? '-'}</td>
                <td>{data?.InletPressureMinQ ?? '-'}</td>
                <td>{data?.PressureUnit || '-'}</td>
              </tr>
              <tr>
                <td>p2</td>
                <td>{data?.OutletPressureMaxQ ?? '-'}</td>
                <td>{data?.OutletPressureNorQ ?? '-'}</td>
                <td>{data?.OutletPressureMinQ ?? '-'}</td>
                <td>{data?.PressureUnit || '-'}</td>
              </tr>
              <tr>
                <td>Δp</td>
                <td>{data?.DifferentialPressureMaxQ ?? '-'}</td>
                <td>{data?.DifferentialPressureNorQ ?? '-'}</td>
                <td>{data?.DifferentialPressureMinQ ?? '-'}</td>
                <td>{data?.PressureUnit || '-'}</td>
              </tr>
              <tr>
                <td>qm</td>
                <td>{data?.QMMax ?? '-'}</td>
                <td>{data?.QMNor ?? '-'}</td>
                <td>{data?.QMMin ?? '-'}</td>
                <td>{data?.QMUnit || '-'}</td>
              </tr>
              <tr>
                <td>qn</td>
                <td>{data?.QNMax ?? '-'}</td>
                <td>{data?.QNNor ?? '-'}</td>
                <td>{data?.QNMin ?? '-'}</td>
                <td>{data?.QNUnit || '-'}</td>
              </tr>
            </tbody>
          </Table>
        </div>
      </div>
    );
  };

  const renderBodyData = () => {
    if (!data || Object.keys(data).length === 0) {
      return null;
    }
    
    return (
      <div className="mt-4">
        <h6 className="mb-3">BODY (본체)</h6>
        <Table bordered size="sm">
          <tbody>
                          <tr>
                <td className="fw-bold" style={{width: '30%'}}>Type</td>
                <td>{data?.ValveType || '-'}</td>
              </tr>
              <tr>
                <td className="fw-bold">Size</td>
                <td>{data?.BodySize || '-'} {data?.BodySizeUnit ? `(${data.BodySizeUnit})` : ''}</td>
              </tr>
              <tr>
                <td className="fw-bold">Material Body</td>
                <td>{data?.BodyMat || '-'}</td>
              </tr>
              <tr>
                <td className="fw-bold">Material Trim</td>
                <td>{data?.TrimMat || '-'}</td>
              </tr>
              <tr>
                <td className="fw-bold">Option</td>
                <td>{data?.TrimOption || '-'}</td>
              </tr>
              <tr>
                <td className="fw-bold">Rating</td>
                <td>{data?.BodyRating || '-'} {data?.BodyRatingUnit ? `(${data.BodyRatingUnit})` : ''}</td>
              </tr>
          </tbody>
        </Table>
      </div>
    );
  };

  const renderActuatorData = () => {
    if (!data || Object.keys(data).length === 0) {
      return null;
    }
    
    return (
      <div className="mt-4">
        <h6 className="mb-3">ACTUATOR (액추에이터)</h6>
        <Table bordered size="sm">
          <tbody>
                          <tr>
                <td className="fw-bold" style={{width: '30%'}}>Type</td>
                <td>{data?.ActType || '-'}</td>
              </tr>
              <tr>
                <td className="fw-bold">H.W</td>
                <td>{data?.IsHW ? 'Yes' : (data?.IsHW === false ? 'No' : '-')}</td>
              </tr>
          </tbody>
        </Table>
      </div>
    );
  };

  const renderAccessoryData = () => {
    if (!data || Object.keys(data).length === 0) {
      return null;
    }
    
    return (
      <div className="mt-4">
        <h6 className="mb-3">ACCESSORY (액세서리)</h6>
        <Table bordered size="sm">
          <tbody>
                          <tr>
                <td className="fw-bold" style={{width: '30%'}}>Positioner</td>
                <td>{data?.IsPositioner ? 'Yes' : (data?.IsPositioner === false ? 'No' : '-')}</td>
              </tr>
              <tr>
                <td className="fw-bold">Type</td>
                <td>{data?.PositionerType || '-'}</td>
              </tr>
              <tr>
                <td className="fw-bold">Explosion proof</td>
                <td>{data?.ExplosionProof || '-'}</td>
              </tr>
              <tr>
                <td className="fw-bold">Transmitter</td>
                <td>{data?.TransmitterType || '-'}</td>
              </tr>
              <tr>
                <td className="fw-bold">Solenoid Valve</td>
                <td>{data?.IsSolenoid ? 'Yes' : (data?.IsSolenoid === false ? 'No' : '-')}</td>
              </tr>
              <tr>
                <td className="fw-bold">Limit Switch</td>
                <td>{data?.IsLimSwitch ? 'Yes' : (data?.IsLimSwitch === false ? 'No' : '-')}</td>
              </tr>
              <tr>
                <td className="fw-bold">Air-set</td>
                <td>{data?.IsAirSet ? 'Yes' : (data?.IsAirSet === false ? 'No' : '-')}</td>
              </tr>
              <tr>
                <td className="fw-bold">Volume booster</td>
                <td>{data?.IsVolumeBooster ? 'Yes' : (data?.IsVolumeBooster === false ? 'No' : '-')}</td>
              </tr>
              <tr>
                <td className="fw-bold">Air Operated Valve</td>
                <td>{data?.IsAirOperated ? 'Yes' : (data?.IsAirOperated === false ? 'No' : '-')}</td>
              </tr>
              <tr>
                <td className="fw-bold">Lockup Valve</td>
                <td>{data?.IsLockUp ? 'Yes' : (data?.IsLockUp === false ? 'No' : '-')}</td>
              </tr>
              <tr>
                <td className="fw-bold">Snap-acting relay</td>
                <td>{data?.IsSnapActingRelay ? 'Yes' : (data?.IsSnapActingRelay === false ? 'No' : '-')}</td>
              </tr>
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <Card>
      <Card.Header>
        <h5>Customer Data (EstimateRequest)</h5>
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <div className="processing-indicator">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">로딩 중...</span>
            </div>
            <span className="ms-2">데이터 로딩 중...</span>
          </div>
        ) : (
          <div className="data-display">
            {renderCustomerData()}
            {renderFluidData()}
            {renderBodyData()}
            {renderActuatorData()}
            {renderAccessoryData()}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default CustomerDataDisplay; 