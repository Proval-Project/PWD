import React from 'react';
import { Table, Form } from 'react-bootstrap';

const CustomerDataDisplay = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">로딩 중...</span>
        </div>
      </div>
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center text-muted p-3">
        고객 데이터가 없습니다.
      </div>
    );
  }

  // 공통 스타일
  const borderColor = '#CDCDCD';
  const labelStyle = { width: '35%', color: '#666', backgroundColor: '#DFDFDF', padding: '8px' };
  const valueStyle = { fontWeight: '500', padding: '8px' };
  const rowBorder = { borderBottom: `1px solid ${borderColor}` };

  return (
    <div style={{ fontSize: '0.85rem' }}>
      {/* CUSTOMER DATA 헤더 */}
      <div className="d-flex align-items-center mb-3">
        <span style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          border: '2px solid #333',
          marginRight: '8px'
        }}></span>
        <strong style={{ fontSize: '1.3rem', fontWeight: '700' }}>CUSTOMER DATA</strong>
      </div>

      {/* 2열 레이아웃 */}
      <div className="row">
        {/* 왼쪽 컬럼 */}
        <div className="col-6">
          {/* Estimate data */}
          <div className="mb-4">
            <div style={{ fontSize: '1.05rem', fontWeight: '700' }} className="mb-2">Estimate data</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>견적번호</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.CurEstimateNo || data?.EstimateNo || '-'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>프로젝트명</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.ProjectName || '-'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>Tag No</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.TagNo || '-'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>회사명</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.CustomerName || '-'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>요청자</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.Requester || '-'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle }}>담당자</td>
                  <td style={{ ...valueStyle }}>{data?.Engineer || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Fluid */}
          <div className="mb-4">
            <div style={{ fontSize: '1.05rem', fontWeight: '700' }} className="mb-2">Fluid</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>Medium</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.Medium || '-'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>Fluid</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.Fluid || '-'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>
                    <div className="d-flex align-items-center">
                      <Form.Check 
                        type="checkbox" 
                        checked={!!data?.Density} 
                        readOnly 
                        className="me-2"
                        style={{ marginTop: 0 }}
                      />
                      Density
                    </div>
                  </td>
                  <td style={{ ...rowBorder, padding: 0 }}>
                    <div style={{ display: 'flex' }}>
                      <span style={{ ...valueStyle, width: '50%', borderRight: `1px solid ${borderColor}` }}>{data?.Density || '-'}</span>
                      <span style={{ ...valueStyle, width: '50%' }} className="text-muted">{data?.DensityUnit || 'kg/m3'}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle }}>
                    <div className="d-flex align-items-center">
                      <Form.Check 
                        type="checkbox" 
                        checked={!!data?.Molecular} 
                        readOnly 
                        className="me-2"
                        style={{ marginTop: 0 }}
                      />
                      Molecular
                    </div>
                  </td>
                  <td style={{ padding: 0 }}>
                    <div style={{ display: 'flex' }}>
                      <span style={{ ...valueStyle, width: '50%', borderRight: `1px solid ${borderColor}` }}>{data?.Molecular || '-'}</span>
                      <span style={{ ...valueStyle, width: '50%' }} className="text-muted">{data?.MolecularWeightUnit || 'kg.lmol'}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

      {/* Operating data */}
          <div className="mb-4">
            <div style={{ fontSize: '1.05rem', fontWeight: '700' }} className="mb-2">Operating data</div>
            <Table bordered size="sm" style={{ marginBottom: 0, backgroundColor: '#EFEFEF' }}>
              <thead>
                <tr>
                  <th style={{ width: '20%', backgroundColor: '#DFDFDF' }}></th>
                  <th className="text-center" style={{ backgroundColor: '#DFDFDF' }}>Max</th>
                  <th className="text-center" style={{ backgroundColor: '#DFDFDF' }}>Normal</th>
                  <th className="text-center" style={{ backgroundColor: '#DFDFDF' }}>Min</th>
                  <th className="text-center" style={{ backgroundColor: '#DFDFDF' }}>Unit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>t1</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.InletTemperatureQ ?? '-'}</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.InletTemperatureNorQ ?? '-'}</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.InletTemperatureMinQ ?? '-'}</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.TemperatureUnit || 'kgf/cm²(g)'}</td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>p1</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.InletPressureMaxQ ?? '-'}</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.InletPressureNorQ ?? '-'}</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.InletPressureMinQ ?? '-'}</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.PressureUnit || 'Mpa(g)'}</td>
                </tr>
                <tr>
                  <td style={{ backgroundColor: '#DFDFDF' }}>
                    <div className="d-flex align-items-center justify-content-center">
                      <Form.Check type="checkbox" checked={!!data?.OutletPressureMaxQ} readOnly className="me-1" />
                      p2
                    </div>
                  </td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.OutletPressureMaxQ ?? '-'}</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.OutletPressureNorQ ?? '-'}</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.OutletPressureMinQ ?? '-'}</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.PressureUnit || 'Mpa(g)'}</td>
                </tr>
                <tr>
                  <td style={{ backgroundColor: '#DFDFDF' }}>
                    <div className="d-flex align-items-center justify-content-center">
                      <Form.Check type="checkbox" checked={!!data?.DifferentialPressureMaxQ} readOnly className="me-1" />
                      Δp
                    </div>
                  </td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.DifferentialPressureMaxQ ?? '-'}</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.DifferentialPressureNorQ ?? '-'}</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.DifferentialPressureMinQ ?? '-'}</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.PressureUnit || 'Mpa(g)'}</td>
                </tr>
                <tr>
                  <td style={{ backgroundColor: '#DFDFDF' }}>
                    <div className="d-flex align-items-center justify-content-center">
                      <Form.Check type="checkbox" checked={!!data?.QMMax} readOnly className="me-1" />
                      qm
                    </div>
                  </td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.QMMax ?? '-'}</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.QMNor ?? '-'}</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.QMMin ?? '-'}</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.QMUnit || 't/h'}</td>
                </tr>
                <tr>
                  <td style={{ backgroundColor: '#DFDFDF' }}>
                    <div className="d-flex align-items-center justify-content-center">
                      <Form.Check type="checkbox" checked={!!data?.QNMax} readOnly className="me-1" />
                      qn
                    </div>
                  </td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.QNMax ?? '-'}</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.QNNor ?? '-'}</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.QNMin ?? '-'}</td>
                  <td className="text-center" style={{ backgroundColor: '#EFEFEF' }}>{data?.QNUnit || 'm3/h'}</td>
                </tr>
              </tbody>
            </Table>
          </div>
        </div>

        {/* 오른쪽 컬럼 */}
        <div className="col-6">
          {/* BODY */}
          <div className="mb-4">
            <div style={{ fontSize: '1.05rem', fontWeight: '700' }} className="mb-2">BODY</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ ...labelStyle, width: '40%', ...rowBorder }}>Type</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.ValveType || '-'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>Size</td>
                  <td style={{ ...rowBorder, padding: 0 }}>
                    <div style={{ display: 'flex' }}>
                      <span style={{ ...valueStyle, width: '50%', borderRight: `1px solid ${borderColor}` }}>{data?.BodySizeUnit || 'inch'}</span>
                      <span style={{ ...valueStyle, width: '50%' }}>{data?.BodySize || '-'}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>Material Body</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.BodyMat || '-'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>Material Trim</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.TrimMat || '-'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>Option</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.TrimOption || '-'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle }}>Rating</td>
                  <td style={{ padding: 0 }}>
                    <div style={{ display: 'flex' }}>
                      <span style={{ ...valueStyle, width: '50%', borderRight: `1px solid ${borderColor}` }}>{data?.BodyRatingUnit || 'JIS'}</span>
                      <span style={{ ...valueStyle, width: '50%' }}>{data?.BodyRating || '-'}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Actuator */}
          <div className="mb-4">
            <div style={{ fontSize: '1.05rem', fontWeight: '700' }} className="mb-2">Actuator</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ ...labelStyle, width: '40%', ...rowBorder }}>Type</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.ActType || '-'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle }}>H.W</td>
                  <td style={{ ...valueStyle }}>{data?.IsHW ? 'Yes' : 'No'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Accessory */}
          <div className="mb-4">
            <div style={{ fontSize: '1.05rem', fontWeight: '700' }} className="mb-2">Accessory</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ ...labelStyle, width: '50%', ...rowBorder }}>Positioner</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.IsPositioner ? 'Yes' : 'No'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, paddingLeft: '20px', ...rowBorder }}>Type</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.PositionerType || '-'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>Explosion proof</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.ExplosionProof || 'No'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>Transmitter</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.TransmitterType || '-'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>Solenoid Valve</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.IsSolenoid ? 'Yes' : 'No'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>Limit Switch</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.IsLimSwitch ? 'Yes' : 'No'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>Air-set</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.IsAirSet ? 'Yes' : 'No'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>Volume booster</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.IsVolumeBooster ? 'Yes' : 'No'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>Air Operated Valve</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.IsAirOperated ? 'Yes' : 'No'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, ...rowBorder }}>Lockup Valve</td>
                  <td style={{ ...valueStyle, ...rowBorder }}>{data?.IsLockUp ? 'Yes' : 'No'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle }}>Snap-acting relay</td>
                  <td style={{ ...valueStyle }}>{data?.IsSnapActingRelay ? 'Yes' : 'No'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDataDisplay;
