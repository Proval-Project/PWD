import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Form, Table } from 'react-bootstrap';
import { getFileStatus, downloadPdf, downloadCcv } from '../services/api';

const ConvalDataDisplay = ({ data, isLoading, onRecalculate, isProcessing, onFileStatusRefresh }) => {
  const [formData, setFormData] = useState({});
  const [fileStatus, setFileStatus] = useState({ pdfExists: false, ccvExists: false });
  const [downloading, setDownloading] = useState({ pdf: false, ccv: false });
  const [fluidType, setFluidType] = useState('n1');
  const [pressureType, setPressureType] = useState('p2');
  const [flowType, setFlowType] = useState('qm');
  const [massType, setMassType] = useState('density');
  
  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const toBool = (v) => {
      if (v === null || v === undefined) return undefined;
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return v !== 0;
      const s = String(v).trim().toLowerCase();
      if (s === 'true' || s === '1' || s === 'y') return true;
      if (s === 'false' || s === '0' || s === 'n') return false;
      return undefined;
    };
    const qm = toBool(data.IsQM);
    if (qm !== undefined) setFlowType(qm ? 'qm' : 'qn');
    const p2 = toBool(data.IsP2);
    if (p2 !== undefined) setPressureType(p2 ? 'p2' : 'dp');
    const n1 = toBool(data.IsN1);
    if (n1 !== undefined) setFluidType(n1 ? 'n1' : 'v1');
    const dens = toBool(data.IsDensity);
    if (dens !== undefined) setMassType(dens ? 'density' : 'molecular');
  }, [data?.IsQM, data?.IsP2, data?.IsN1, data?.IsDensity]);

  useEffect(() => {
    setFormData((prev) => prev ? { ...prev, IsP2: pressureType === 'p2' } : prev);
  }, [pressureType]);

  useEffect(() => {
    setFormData((prev) => prev ? { ...prev, IsQM: flowType === 'qm' } : prev);
  }, [flowType]);

  useEffect(() => {
    setFormData((prev) => prev ? { ...prev, IsN1: fluidType === 'n1' } : prev);
  }, [fluidType]);

  useEffect(() => {
    setFormData((prev) => prev ? { ...prev, IsDensity: massType === 'density' } : prev);
  }, [massType]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // 파일 상태 확인
  useEffect(() => {
    if (data?.TempEstimateNo) {
      checkFileStatus(data.TempEstimateNo);
    }
  }, [data?.TempEstimateNo]);

  useEffect(() => {
    if (!isProcessing && data?.TempEstimateNo) {
      setTimeout(() => {
        checkFileStatus(data.TempEstimateNo);
      }, 2000);
    }
  }, [isProcessing, data?.TempEstimateNo]);

  const checkFileStatus = async (estimateNo) => {
    try {
      const status = await getFileStatus(estimateNo);
      setFileStatus({ pdfExists: status.pdfExists, ccvExists: status.ccvExists });
      if (onFileStatusRefresh) onFileStatusRefresh();
    } catch (error) {
      console.error('파일 상태 확인 실패:', error);
      setFileStatus({ pdfExists: false, ccvExists: false });
    }
  };

  const handlePdfDownload = async () => {
    if (!data?.TempEstimateNo) return;
    setDownloading(prev => ({ ...prev, pdf: true }));
    try {
      await downloadPdf(data.TempEstimateNo);
    } catch (error) {
      alert('PDF 파일 다운로드 실패: ' + error.message);
    } finally {
      setDownloading(prev => ({ ...prev, pdf: false }));
    }
  };

  const handleCcvDownload = async () => {
    if (!data?.TempEstimateNo) return;
    setDownloading(prev => ({ ...prev, ccv: true }));
    try {
      await downloadCcv(data.TempEstimateNo);
    } catch (error) {
      alert('CCV 파일 다운로드 실패: ' + error.message);
    } finally {
      setDownloading(prev => ({ ...prev, ccv: false }));
    }
  };

  const handlePdfView = async () => {
    if (!data?.TempEstimateNo) return;
    try {
      const response = await fetch(`http://192.168.0.59:7001/api/conval/download/pdf/${data.TempEstimateNo}`, {
        method: 'GET',
        headers: { 'Accept': 'application/pdf' },
        mode: 'cors',
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      } else {
        alert(`PDF 파일을 열 수 없습니다: ${response.status}`);
      }
    } catch (error) {
      alert('PDF 파일 열기 실패: ' + error.message);
    }
  };

  const handleCcvView = async () => {
    if (!data?.TempEstimateNo) return;
    try {
      const response = await fetch(`http://192.168.0.59:7001/api/conval/download/ccv/${data.TempEstimateNo}`, {
        method: 'GET',
        headers: { 'Accept': 'text/plain, application/octet-stream' },
        mode: 'cors',
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      } else {
        alert(`CCV 파일을 열 수 없습니다: ${response.status}`);
      }
    } catch (error) {
      alert('CCV 파일 열기 실패: ' + error.message);
    }
  };

  const handleRecalculate = async () => {
    if (onRecalculate) {
      const currentData = {
        ...formData,
        IsP2: pressureType === 'p2',
        IsQM: flowType === 'qm',
        IsN1: fluidType === 'n1',
        IsDensity: massType === 'density'
      };
      await onRecalculate(currentData);
    }
  };

  const handleReset = () => {
    if (data) {
      setFormData(data);
    }
  };

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
        CONVAL 데이터가 없습니다.
      </div>
    );
  }

  // 압력 단위 옵션
  const pressureUnitOptions = [
    'Mpa(g)', 'bar(a)', 'bar(g)', 'kPa(a)', 'kPa(g)', 'MPa(a)', 'psi(a)', 'psi(g)', 'kgf/cm²(a)', 'kgf/cm²(g)'
  ];

  return (
    <div style={{ fontSize: '0.85rem' }}>
      {/* CONVAL DATA 헤더 */}
      <div className="d-flex align-items-center mb-3">
        <span style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          border: '2px solid #333',
          marginRight: '8px'
        }}></span>
        <strong style={{ fontSize: '1.3rem', fontWeight: '700' }}>CONVAL DATA</strong>
      </div>

      {/* 2컬럼 레이아웃 */}
      <Row>
        {/* 왼쪽 컬럼 */}
        <Col md={6}>
          {/* Medium selection and state */}
          <div className="mb-4">
            <div style={{ fontSize: '1.05rem', fontWeight: '700' }} className="mb-2">Medium selection and state</div>
            <Table borderless size="sm">
              <tbody>
                <tr>
                  <td style={{ width: '35%', color: '#666', backgroundColor: '#DFDFDF', backgroundColor: '#DFDFDF' }}>Medium</td>
                  <td><Form.Control size="sm" value={formData.Medium || ''} onChange={(e) => handleInputChange('Medium', e.target.value)} /></td>
                </tr>
                <tr>
                  <td style={{ color: '#666', backgroundColor: '#DFDFDF', backgroundColor: '#DFDFDF' }}>Fluid</td>
                  <td>
                    <Form.Select size="sm" value={formData.Fluid || ''} onChange={(e) => handleInputChange('Fluid', e.target.value)}>
                      <option value="">선택</option>
                      <option value="Liquid">Liquid</option>
                      <option value="Vaporous">Vaporous</option>
                      <option value="Gaseous">Gaseous</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666', backgroundColor: '#DFDFDF' }}>Density</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Form.Control size="sm" value={formData.Density || ''} onChange={(e) => handleInputChange('Density', e.target.value)} style={{ maxWidth: '100px' }} />
                      <Form.Select size="sm" value={formData.DensityUnit || 'kg/m3'} onChange={(e) => handleInputChange('DensityUnit', e.target.value)} style={{ maxWidth: '100px' }}>
                        <option value="kg/m3">kg/m3</option>
                        <option value="kg/l">kg/l</option>
                      </Form.Select>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666', backgroundColor: '#DFDFDF' }}>Molecular</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Form.Control size="sm" value={formData.Molecular || ''} onChange={(e) => handleInputChange('Molecular', e.target.value)} style={{ maxWidth: '100px' }} />
                      <Form.Select size="sm" value={formData.MolecularWeightUnit || 'kg.lmol'} onChange={(e) => handleInputChange('MolecularWeightUnit', e.target.value)} style={{ maxWidth: '100px' }}>
                        <option value="kg.lmol">kg.lmol</option>
                        <option value="g/mol">g/mol</option>
                      </Form.Select>
                    </div>
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>

          {/* Operating data */}
          <div className="mb-4">
            <div style={{ fontSize: '1.05rem', fontWeight: '700' }} className="mb-2">Operating data</div>
            <Table bordered size="sm" style={{ backgroundColor: '#f8f9fa' }}>
              <thead>
                <tr style={{ backgroundColor: '#DFDFDF' }}>
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
                  <td><Form.Control size="sm" value={formData.t1Max || ''} onChange={(e) => handleInputChange('t1Max', e.target.value)} /></td>
                  <td><Form.Control size="sm" value={formData.t1Normal || ''} onChange={(e) => handleInputChange('t1Normal', e.target.value)} /></td>
                  <td><Form.Control size="sm" value={formData.t1Min || ''} onChange={(e) => handleInputChange('t1Min', e.target.value)} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.t1Unit || 'kgf/cm²(g)'} onChange={(e) => handleInputChange('t1Unit', e.target.value)}>
                      <option value="kgf/cm²(g)">kgf/cm²(g)</option>
                      <option value="°C">°C</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>p1</td>
                  <td><Form.Control size="sm" value={formData.p1Max || ''} onChange={(e) => handleInputChange('p1Max', e.target.value)} /></td>
                  <td><Form.Control size="sm" value={formData.p1Normal || ''} onChange={(e) => handleInputChange('p1Normal', e.target.value)} /></td>
                  <td><Form.Control size="sm" value={formData.p1Min || ''} onChange={(e) => handleInputChange('p1Min', e.target.value)} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.PressureUnit || 'Mpa(g)'} onChange={(e) => handleInputChange('PressureUnit', e.target.value)}>
                      {pressureUnitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td style={{ backgroundColor: '#DFDFDF' }}>
                    <div className="d-flex align-items-center justify-content-center">
                      <Form.Check type="checkbox" checked={pressureType === 'p2'} onChange={() => setPressureType('p2')} className="me-1" />
                      p2
                    </div>
                  </td>
                  <td><Form.Control size="sm" value={formData.p2Max || ''} onChange={(e) => handleInputChange('p2Max', e.target.value)} disabled={pressureType !== 'p2'} /></td>
                  <td><Form.Control size="sm" value={formData.p2Normal || ''} onChange={(e) => handleInputChange('p2Normal', e.target.value)} disabled={pressureType !== 'p2'} /></td>
                  <td><Form.Control size="sm" value={formData.p2Min || ''} onChange={(e) => handleInputChange('p2Min', e.target.value)} disabled={pressureType !== 'p2'} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.PressureUnit || 'Mpa(g)'} onChange={(e) => handleInputChange('PressureUnit', e.target.value)}>
                      {pressureUnitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td style={{ backgroundColor: '#DFDFDF' }}>
                    <div className="d-flex align-items-center justify-content-center">
                      <Form.Check type="checkbox" checked={pressureType === 'dp'} onChange={() => setPressureType('dp')} className="me-1" />
                      Δp
                    </div>
                  </td>
                  <td><Form.Control size="sm" value={formData.dpMax || ''} onChange={(e) => handleInputChange('dpMax', e.target.value)} disabled={pressureType !== 'dp'} /></td>
                  <td><Form.Control size="sm" value={formData.dpNormal || ''} onChange={(e) => handleInputChange('dpNormal', e.target.value)} disabled={pressureType !== 'dp'} /></td>
                  <td><Form.Control size="sm" value={formData.dpMin || ''} onChange={(e) => handleInputChange('dpMin', e.target.value)} disabled={pressureType !== 'dp'} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.PressureUnit || 'Mpa(g)'} onChange={(e) => handleInputChange('PressureUnit', e.target.value)}>
                      {pressureUnitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>CV</td>
                  <td><Form.Control size="sm" value={formData.CVMax || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.CVNormal || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.CVMin || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.CVUnit || 'Mpa(g)'} onChange={(e) => handleInputChange('CVUnit', e.target.value)}>
                      {pressureUnitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td style={{ backgroundColor: '#DFDFDF' }}>
                    <div className="d-flex align-items-center justify-content-center">
                      <Form.Check type="checkbox" checked={flowType === 'qm'} onChange={() => setFlowType('qm')} className="me-1" />
                      qm
                    </div>
                  </td>
                  <td><Form.Control size="sm" value={formData.qmMax || ''} onChange={(e) => handleInputChange('qmMax', e.target.value)} disabled={flowType !== 'qm'} /></td>
                  <td><Form.Control size="sm" value={formData.qmNormal || ''} onChange={(e) => handleInputChange('qmNormal', e.target.value)} disabled={flowType !== 'qm'} /></td>
                  <td><Form.Control size="sm" value={formData.qmMin || ''} onChange={(e) => handleInputChange('qmMin', e.target.value)} disabled={flowType !== 'qm'} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.qmUnit || 't/h'} onChange={(e) => handleInputChange('qmUnit', e.target.value)}>
                      <option value="t/h">t/h</option>
                      <option value="kg/h">kg/h</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td style={{ backgroundColor: '#DFDFDF' }}>
                    <div className="d-flex align-items-center justify-content-center">
                      <Form.Check type="checkbox" checked={flowType === 'qn'} onChange={() => setFlowType('qn')} className="me-1" />
                      qn
                    </div>
                  </td>
                  <td><Form.Control size="sm" value={formData.qnMax || ''} onChange={(e) => handleInputChange('qnMax', e.target.value)} disabled={flowType !== 'qn'} /></td>
                  <td><Form.Control size="sm" value={formData.qnNormal || ''} onChange={(e) => handleInputChange('qnNormal', e.target.value)} disabled={flowType !== 'qn'} /></td>
                  <td><Form.Control size="sm" value={formData.qnMin || ''} onChange={(e) => handleInputChange('qnMin', e.target.value)} disabled={flowType !== 'qn'} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.qnUnit || 'm3/h'} onChange={(e) => handleInputChange('qnUnit', e.target.value)}>
                      <option value="m3/h">m3/h</option>
                      <option value="l/h">l/h</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>s/s100</td>
                  <td><Form.Control size="sm" value={formData.SS100Max || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.SS100Nor || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.SS100Min || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.SS100Unit || '%'} onChange={(e) => handleInputChange('SS100Unit', e.target.value)}>
                      <option value="%">%</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>LpAe</td>
                  <td><Form.Control size="sm" value={formData.LpAeMax || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.LpAeNormal || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.LpAeMin || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td>dB(A)</td>
                </tr>
                <tr>
                  <td colSpan={5} className="text-center" style={{ backgroundColor: '#e9ecef' }}>{formData.WarningStateMax || 'Cavitation'}</td>
                </tr>
                <tr>
                  <td colSpan={5} className="text-center" style={{ backgroundColor: '#e9ecef' }}>{formData.WarningTypeMax || 'Cavitation'}</td>
                </tr>
              </tbody>
            </Table>
          </div>

          {/* Fluid Operating data */}
          <div className="mb-4">
            <div style={{ fontSize: '1.05rem', fontWeight: '700' }} className="mb-2">Fluid Operating data</div>
            <Table bordered size="sm" style={{ backgroundColor: '#f8f9fa' }}>
              <thead>
                <tr style={{ backgroundColor: '#DFDFDF' }}>
                  <th style={{ width: '20%', backgroundColor: '#DFDFDF' }}></th>
                  <th className="text-center" style={{ backgroundColor: '#DFDFDF' }}>Max</th>
                  <th className="text-center" style={{ backgroundColor: '#DFDFDF' }}>Normal</th>
                  <th className="text-center" style={{ backgroundColor: '#DFDFDF' }}>Min</th>
                  <th className="text-center" style={{ backgroundColor: '#DFDFDF' }}>Unit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ backgroundColor: '#DFDFDF' }}>
                    <div className="d-flex align-items-center justify-content-center">
                      <Form.Check type="checkbox" checked readOnly className="me-1" />
                      ϱ1
                    </div>
                  </td>
                  <td><Form.Control size="sm" value={formData.FluidP1Max || ''} onChange={(e) => handleInputChange('FluidP1Max', e.target.value)} /></td>
                  <td><Form.Control size="sm" value={formData.FluidP1Nor || ''} onChange={(e) => handleInputChange('FluidP1Nor', e.target.value)} /></td>
                  <td><Form.Control size="sm" value={formData.FluidP1Min || ''} onChange={(e) => handleInputChange('FluidP1Min', e.target.value)} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.FluidPUnit || 'kgf/cm²(g)'} onChange={(e) => handleInputChange('FluidPUnit', e.target.value)}>
                      <option value="kgf/cm²(g)">kgf/cm²(g)</option>
                      <option value="kg/m³">kg/m³</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>ϱ2</td>
                  <td><Form.Control size="sm" value={formData.FluidP2Max || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.FluidP2Nor || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.FluidP2Min || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.FluidPUnit || 'kg/m3'} onChange={(e) => handleInputChange('FluidPUnit', e.target.value)}>
                      <option value="kg/m3">kg/m3</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td style={{ backgroundColor: '#DFDFDF' }}>
                    <div className="d-flex align-items-center justify-content-center">
                      <Form.Check type="checkbox" checked={fluidType === 'n1'} onChange={() => setFluidType('n1')} className="me-1" />
                      η1
                    </div>
                  </td>
                  <td><Form.Control size="sm" value={formData.FluidN1Max || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.FluidN1Nor || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.FluidN1Min || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.FluidN1Unit || 'mPa s'} onChange={(e) => handleInputChange('FluidN1Unit', e.target.value)}>
                      <option value="mPa s">mPa s</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td style={{ backgroundColor: '#DFDFDF' }}>
                    <div className="d-flex align-items-center justify-content-center">
                      <Form.Check type="checkbox" checked={fluidType === 'v1'} onChange={() => setFluidType('v1')} className="me-1" />
                      ν1
                    </div>
                  </td>
                  <td><Form.Control size="sm" value={formData.FluidV1Max || ''} onChange={(e) => handleInputChange('FluidV1Max', e.target.value)} /></td>
                  <td><Form.Control size="sm" value={formData.FluidV1Nor || ''} onChange={(e) => handleInputChange('FluidV1Nor', e.target.value)} /></td>
                  <td><Form.Control size="sm" value={formData.FluidV1Min || ''} onChange={(e) => handleInputChange('FluidV1Min', e.target.value)} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.FluidV1Unit || 'mm²/s'} onChange={(e) => handleInputChange('FluidV1Unit', e.target.value)}>
                      <option value="mm²/s">mm²/s</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>pv1</td>
                  <td><Form.Control size="sm" value={formData.FluidPV1Max || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.FluidPV1Nor || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.FluidPV1Min || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.FluidPV1Unit || 'bar(a)'} onChange={(e) => handleInputChange('FluidPV1Unit', e.target.value)}>
                      <option value="bar(a)">bar(a)</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>tv1</td>
                  <td><Form.Control size="sm" value={formData.FluidTV1Max || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.FluidTV1Nor || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.FluidTV1Min || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.FluidTV1Unit || '°C'} onChange={(e) => handleInputChange('FluidTV1Unit', e.target.value)}>
                      <option value="°C">°C</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>cF1</td>
                  <td><Form.Control size="sm" value={formData.FluidCF1Max || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.FluidCF1Nor || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.FluidCF1Min || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.FluidCF1Unit || 'm/s'} onChange={(e) => handleInputChange('FluidCF1Unit', e.target.value)}>
                      <option value="m/s">m/s</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>ϰ</td>
                  <td><Form.Control size="sm" value={formData.FluidKMax || ''} onChange={(e) => handleInputChange('FluidKMax', e.target.value)} /></td>
                  <td><Form.Control size="sm" value={formData.FluidKNor || ''} onChange={(e) => handleInputChange('FluidKNor', e.target.value)} /></td>
                  <td><Form.Control size="sm" value={formData.FluidKMin || ''} onChange={(e) => handleInputChange('FluidKMin', e.target.value)} /></td>
                  <td></td>
                </tr>
              </tbody>
            </Table>
          </div>
        </Col>

        {/* 오른쪽 컬럼 */}
        <Col md={6}>
          {/* 버튼 그룹 */}
          <div className="mb-4" style={{ backgroundColor: '#DFDFDF', padding: '15px', borderRadius: '8px', height: '165px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginTop: '33px' }}>
            <div className="d-flex gap-3">
              <Button 
                onClick={handleReset}
                style={{ 
                  flex: 1, 
                  padding: '10px 16px', 
                  fontSize: '0.95rem', 
                  fontWeight: '600',
                  backgroundColor: '#6c757d',
                  border: 'none',
                  borderRadius: '6px'
                }}
              >
                초기화
              </Button>
              <Button 
                onClick={handleRecalculate}
                disabled={isProcessing}
                style={{ 
                  flex: 1, 
                  padding: '10px 16px', 
                  fontSize: '0.95rem', 
                  fontWeight: '600',
                  backgroundColor: '#3b7dd8',
                  border: 'none',
                  borderRadius: '6px'
                }}
              >
                {isProcessing ? '처리 중...' : 'CONVAL 재호출'}
              </Button>
            </div>
            <div className="d-flex align-items-center">
              <span style={{ width: '70px', fontWeight: '600', fontSize: '0.85rem' }}>PDF FILE</span>
              <div className="d-flex gap-2 flex-grow-1">
                <Button 
                  variant="light" 
                  onClick={handlePdfDownload} 
                  disabled={downloading.pdf} 
                  style={{ 
                    flex: 1, 
                    fontSize: '0.85rem', 
                    padding: '6px 12px',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    color: '#000',
                    fontWeight: '600'
                  }}
                >
                  다운로드
                </Button>
                <Button 
                  variant="light" 
                  onClick={handlePdfView} 
                  style={{ 
                    flex: 1, 
                    fontSize: '0.85rem', 
                    padding: '6px 12px',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    color: '#000',
                    fontWeight: '600'
                  }}
                >
                  바로읽기
                </Button>
              </div>
            </div>
            <div className="d-flex align-items-center">
              <span style={{ width: '70px', fontWeight: '600', fontSize: '0.85rem' }}>CCV FILE</span>
              <div className="d-flex gap-2 flex-grow-1">
                <Button 
                  variant="light" 
                  onClick={handleCcvDownload} 
                  disabled={downloading.ccv} 
                  style={{ 
                    flex: 1, 
                    fontSize: '0.85rem', 
                    padding: '6px 12px',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    color: '#000',
                    fontWeight: '600'
                  }}
                >
                  다운로드
                </Button>
                <Button 
                  variant="light" 
                  onClick={handleCcvView} 
                  style={{ 
                    flex: 1, 
                    fontSize: '0.85rem', 
                    padding: '6px 12px',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    color: '#000',
                    fontWeight: '600'
                  }}
                >
                  바로읽기
                </Button>
              </div>
            </div>
          </div>

          {/* Valve Configuration */}
          <div className="mb-4">
            <div style={{ fontSize: '1.05rem', fontWeight: '700' }} className="mb-2">Valve Configuration</div>
            <Table borderless size="sm">
              <tbody>
                <tr>
                  <td style={{ width: '45%', color: '#666', backgroundColor: '#DFDFDF' }}>Valve type</td>
                  <td>
                    <Form.Select size="sm" value={formData.ValveType || ''} onChange={(e) => handleInputChange('ValveType', e.target.value)}>
                      <option value="">선택</option>
                      <option value="Straight globe valve">Straight globe valve</option>
                      <option value="Angle globe valve">Angle globe valve</option>
                      <option value="Ball valve">Ball valve</option>
                      <option value="Butterfly valve">Butterfly valve</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666', backgroundColor: '#DFDFDF' }}>Trim type</td>
                  <td>
                    <Form.Select size="sm" value={formData.CONVALTrim || ''} onChange={(e) => handleInputChange('CONVALTrim', e.target.value)}>
                      <option value="">선택</option>
                      <option value="Cage trim">Cage trim</option>
                      <option value="Parabolic plug">Parabolic plug</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666', backgroundColor: '#DFDFDF' }}>Flow direction</td>
                  <td>
                    <Form.Select size="sm" value={formData.FlowDirection || ''} onChange={(e) => handleInputChange('FlowDirection', e.target.value)}>
                      <option value="">선택</option>
                      <option value="FTO">FTO</option>
                      <option value="FTC">FTC</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666', backgroundColor: '#DFDFDF' }}>Valve performance class</td>
                  <td>
                    <Form.Select size="sm" value={formData.ValvePerformClass || ''} onChange={(e) => handleInputChange('ValvePerformClass', e.target.value)}>
                      <option value="">선택</option>
                      <option value="Heavy duty valve">Heavy duty valve</option>
                      <option value="Multi stage valve">Multi stage valve</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666', backgroundColor: '#DFDFDF' }}>Protection</td>
                  <td>
                    <Form.Select size="sm" value={formData.Protection || ''} onChange={(e) => handleInputChange('Protection', e.target.value)}>
                      <option value="">선택</option>
                      <option value="Hardened seat/plug">Hardened seat/plug</option>
                      <option value="Non-hardened">Non-hardened</option>
                    </Form.Select>
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>

          {/* Valve data */}
          <div className="mb-4">
            <div style={{ fontSize: '1.05rem', fontWeight: '700' }} className="mb-2">Valve data</div>
            <Table borderless size="sm">
              <tbody>
                <tr>
                  <td style={{ width: '45%', color: '#666', backgroundColor: '#DFDFDF' }}>Basic characteristic</td>
                  <td>
                    <Form.Select size="sm" value={formData.BasicCharacter || ''} onChange={(e) => handleInputChange('BasicCharacter', e.target.value)}>
                      <option value="">선택</option>
                      <option value="Linear">Linear</option>
                      <option value="Equal percentage">Equal percentage</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666', backgroundColor: '#DFDFDF' }}>Theoretical rangeability</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Form.Control size="sm" value={formData.TheoreticalRangeability || ''} onChange={(e) => handleInputChange('TheoreticalRangeability', e.target.value)} style={{ maxWidth: '80px' }} />
                      <Form.Select size="sm" value={formData.TheoreticalRangeabilityUnit || '%'} onChange={(e) => handleInputChange('TheoreticalRangeabilityUnit', e.target.value)} style={{ maxWidth: '60px' }}>
                        <option value="%">%</option>
                      </Form.Select>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666', backgroundColor: '#DFDFDF' }}>Flow coefficient</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Form.Control size="sm" value={formData.FlowCoeff || ''} readOnly style={{ backgroundColor: '#e9ecef', maxWidth: '80px' }} />
                      <Form.Select size="sm" value={formData.FlowCoeffUnit || 'GMP(US)'} onChange={(e) => handleInputChange('FlowCoeffUnit', e.target.value)} style={{ maxWidth: '100px' }}>
                        <option value="GMP(US)">GMP(US)</option>
                        <option value="m³/h">m³/h</option>
                      </Form.Select>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666', backgroundColor: '#DFDFDF' }}>Normal flow coefficient</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Form.Control size="sm" value={formData.NorFlowCoeff || ''} onChange={(e) => handleInputChange('NorFlowCoeff', e.target.value)} style={{ maxWidth: '80px' }} />
                      <Form.Select size="sm" value={formData.FlowCoeffUnit || 'GMP(US)'} onChange={(e) => handleInputChange('FlowCoeffUnit', e.target.value)} style={{ maxWidth: '100px' }}>
                        <option value="GMP(US)">GMP(US)</option>
                        <option value="m³/h">m³/h</option>
                      </Form.Select>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666', backgroundColor: '#DFDFDF' }}>Size and pressure class</td>
                  <td>
                    <Form.Select size="sm" value={formData.SizePressureClass || ''} onChange={(e) => handleInputChange('SizePressureClass', e.target.value)}>
                      <option value="">선택</option>
                      <option value="ANSI">ANSI</option>
                      <option value="DIN">DIN</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666', backgroundColor: '#DFDFDF' }}>Selected valve size</td>
                  <td>
                    <Form.Select size="sm" value={formData.BodySize || ''} onChange={(e) => handleInputChange('BodySize', e.target.value)}>
                      <option value="">선택</option>
                      <option value='1/2"'>1/2"</option>
                      <option value='1"'>1"</option>
                      <option value='2"'>2"</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666', backgroundColor: '#DFDFDF' }}>Pressure class</td>
                  <td>
                    <Form.Select size="sm" value={formData.PressureClass || ''} onChange={(e) => handleInputChange('PressureClass', e.target.value)}>
                      <option value="">선택</option>
                      <option value="class 150">class 150</option>
                      <option value="class 300">class 300</option>
                      <option value="class 600">class 600</option>
                    </Form.Select>
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>

          {/* Load-dependent values */}
          <div className="mb-4">
            <div style={{ fontSize: '1.05rem', fontWeight: '700' }} className="mb-2">Load-dependent values</div>
            <Table bordered size="sm" style={{ backgroundColor: '#f8f9fa' }}>
              <thead>
                <tr style={{ backgroundColor: '#DFDFDF' }}>
                  <th style={{ width: '20%', backgroundColor: '#DFDFDF' }}></th>
                  <th className="text-center" style={{ backgroundColor: '#DFDFDF' }}>Max</th>
                  <th className="text-center" style={{ backgroundColor: '#DFDFDF' }}>Normal</th>
                  <th className="text-center" style={{ backgroundColor: '#DFDFDF' }}>Min</th>
                  <th className="text-center" style={{ backgroundColor: '#DFDFDF' }}>Unit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>s/s100</td>
                  <td><Form.Control size="sm" value={formData.SS100Max || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.SS100Nor || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.SS100Min || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.SS100Unit || '%'} onChange={(e) => handleInputChange('SS100Unit', e.target.value)}>
                      <option value="%">%</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>u1</td>
                  <td><Form.Control size="sm" value={formData.U1Max || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.U1Nor || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.U1Min || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.U1Unit || 'kg/m3'} onChange={(e) => handleInputChange('U1Unit', e.target.value)}>
                      <option value="kg/m3">kg/m3</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>u2</td>
                  <td><Form.Control size="sm" value={formData.U2Max || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.U2Nor || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.U2Min || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>LpAe</td>
                  <td><Form.Control size="sm" value={formData.LpAeMax || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.LpAeNormal || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.LpAeMin || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td>dB(A)</td>
                </tr>
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ConvalDataDisplay;
