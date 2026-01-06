import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Form, Table } from 'react-bootstrap';
import { getFileStatus, downloadPdf, downloadCcv } from '../services/api';

const ConvalDataDisplay = ({ data, isLoading, onServerReset, onRecalculate, isProcessing, isQueued, onFileStatusRefresh }) => {
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

  const handleResetClick = () => {
    if (onServerReset) {
      onServerReset();
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
    '',
    'bar(a)',
    'mbar(a)',
    'Pa(a)',
    'kPa(a)',
    'MPa(a)',
    'at(a)',
    'atm(a)',
    'kp/cm²(a)',
    'N/m²(a)',
    'N/mm²(a)',
    'Torr(a)',
    'mmHg(a)',
    'mmH2O(a)',
    'psi(a)',
    'ftH2O(a)',
    'inHg(a)',
    'inH2O(a)',
    'lbf/ft²(a)',
    'bar(g)',
    'mbar(g)',
    'Pa(g)',
    'kPa(g)',
    'MPa(g)',
    'at(g)',
    'atm(g)',
    'kp/cm²(g)',
    'N/m²(g)',
    'N/mm²(g)',
    'Torr(g)',
    'mmHg(g)',
    'mmH2O(g)',
    'psi(g)',
    'ftH2O(g)',
    'inHg(g)',
    'inH2O(g)',
    'lbf/ft²(g)',
    'kgf/cm²(a)',
    'kgf/cm²(g)'
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
                      <option value="">단위 선택</option>
                      <option value="Liquid">Liquid</option>
                      <option value="Vaporous">Vaporous</option>
                      <option value="Gaseous">Gaseous</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                <td style={{ backgroundColor: '#DFDFDF' }}>
                  <div className="d-flex align-items-center justify-content-center">
                    <Form.Check
                      type="checkbox"
                      checked={massType === 'density'}
                      onChange={() => setMassType('density')}
                      className="me-1"
                    />
                    Density
                  </div>
                </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Form.Control size="sm" value={formData.Density || ''} onChange={(e) => handleInputChange('Density', e.target.value)} style={{ maxWidth: '100px' } } disabled={massType !== 'density'} />
                      <Form.Select size="sm" value={formData.DensityUnit || 'kg/m³'} onChange={(e) => handleInputChange('DensityUnit', e.target.value)} style={{ maxWidth: '100px' }}>
                      <option value="">단위 선택</option>
                      <option value="kg/m³">kg/m³</option>
                      <option value="kg/l">kg/l</option>
                      <option value="gr/ft³">gr/ft³</option>
                      <option value="lb/ft³">lb/ft³</option>
                      <option value="lb/gal(US)">lb/gal(US)</option>
                      <option value="lb/gal(UK)">lb/gal(UK)</option>
                      <option value="g/ml">g/ml</option>
                      <option value="oz/gal(US)">oz/gal(US)</option>
                      <option value="oz/gal(UK)">oz/gal(UK)</option>
                      <option value="oz/in³">oz/in³</option>
                      <option value="lb/in³">lb/in³</option>
                      <option value="slug/ft³">slug/ft³</option>
                      <option value="ton/yd³(UK)">ton/yd³(UK)</option>
                      <option value="ton/yd³(US)">ton/yd³(US)</option>
                      <option value="g/cm³">g/cm³</option>
                      <option value="mg/l">mg/l</option>
                      <option value="mg/m³">mg/m³</option>
                      <option value="SG.H2O(60°F)">SG.H2O(60°F)</option>
                      <option value="SG.H2O(68°F)">SG.H2O(68°F)</option>
                      <option value="SG.H2O(4°C)">SG.H2O(4°C)</option>
                      </Form.Select>
                    </div>
                  </td>
                </tr>
                <tr>
                <td style={{ backgroundColor: '#DFDFDF' }}>
                  <div className="d-flex align-items-center justify-content-center">
                    <Form.Check
                      type="checkbox"
                      checked={massType === 'molecular'}
                      onChange={() => setMassType('molecular')}
                      className="me-1"
                    />
                    Molecular
                  </div>
                </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Form.Control size="sm" value={formData.Molecular || ''} onChange={(e) => handleInputChange('Molecular', e.target.value)} style={{ maxWidth: '100px' } } disabled={massType !== 'molecular'} />
                      <Form.Select size="sm" value={formData.MolecularWeightUnit || 'kg/kmol'} onChange={(e) => handleInputChange('MolecularWeightUnit', e.target.value)} style={{ maxWidth: '100px' }}>
                      <option value="">단위 선택</option>
                      <option value="kg/kmol">kg/kmol</option>
                      <option value="g/mol">g/mol</option>
                      <option value="lb/lbmol">lb/lbmol</option>
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
                    <Form.Select size="sm" value={formData.t1Unit || '°C'} onChange={(e) => handleInputChange('t1Unit', e.target.value)}>
                    <option value="">단위 선택</option>
                    <option value="°C">°C</option>
                    <option value="K">K</option>
                    <option value="°F">°F</option>
                    <option value="°Reaumur">°Reaumur</option>
                    <option value="°Rankine">°Rankine</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>p1</td>
                  <td><Form.Control size="sm" value={formData.p1Max || ''} onChange={(e) => handleInputChange('p1Max', e.target.value)} /></td>
                  <td><Form.Control size="sm" value={formData.p1Normal || ''} onChange={(e) => handleInputChange('p1Normal', e.target.value)} /></td>
                  <td><Form.Control size="sm" value={formData.p1Min || ''} onChange={(e) => handleInputChange('p1Min', e.target.value)} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.PressureUnit || 'bar(a)'} onChange={(e) => handleInputChange('PressureUnit', e.target.value)}>
                      {pressureUnitOptions.map(u => <option key={u || 'empty'} value={u}>{u || '단위 선택'}</option>)}
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
                    <Form.Select size="sm" value={formData.PressureUnit || 'bar(a)'} onChange={(e) => handleInputChange('PressureUnit', e.target.value)}>
                      {pressureUnitOptions.map(u => <option key={u || 'empty'} value={u}>{u || '단위 선택'}</option>)}
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
                    <Form.Select size="sm" value={formData.PressureUnit || 'bar(a)'} onChange={(e) => handleInputChange('PressureUnit', e.target.value)}>
                      {pressureUnitOptions.map(u => <option key={u || 'empty'} value={u}>{u || '단위 선택'}</option>)}
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>CV</td>
                  <td><Form.Control size="sm" value={formData.CVMax || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.CVNormal || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.CVMin || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.CVUnit || 'm³/h'} onChange={(e) => handleInputChange('CVUnit', e.target.value)}>
                    <option value="">단위 선택</option>
                    <option value="m³/h">m³/h</option>
                    <option value="GPM(US)">GPM(US)</option>
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
                    <Form.Select size="sm" value={formData.qmUnit || 'kg/h'} onChange={(e) => handleInputChange('qmUnit', e.target.value)}>
                    <option value="">단위 선택</option>
                    <option value="kg/h">kg/h</option>
                    <option value="kg/s">kg/s</option>
                    <option value="t/h">t/h</option>
                    <option value="t/d">t/d</option>
                    <option value="ton/h(US)">ton/h(US)</option>
                    <option value="ton/d(US)">ton/d(US)</option>
                    <option value="ton/h(UK)">ton/h(UK)</option>
                    <option value="ton/d(UK)">ton/d(UK)</option>
                    <option value="lb/h">lb/h</option>
                    <option value="lb/s">lb/s</option>
                    <option value="g/h">g/h</option>
                    <option value="g/min">g/min</option>
                    <option value="g/s">g/s</option>
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
                      <option value="">단위 선택</option>
                      {formData.Fluid === 'Gaseous' ? (
                        // Gaseous용 단위 옵션
                        <>
                          <option value="m³/h">m³/h</option>
                          <option value="m³/s">m³/s</option>
                          <option value="m³/d">m³/d</option>
                          <option value="l/h">l/h</option>
                          <option value="l/s">l/s</option>
                          <option value="l/min">l/min</option>
                          <option value="GPH(US)">GPH(US)</option>
                          <option value="GPM(US)">GPM(US)</option>
                          <option value="MMSCFD">MMSCFD</option>
                          <option value="MSCFD">MSCFD</option>
                          <option value="MMSCFH">MMSCFH</option>
                          <option value="MSCFH">MSCFH</option>
                          <option value="SCFH">SCFH</option>
                          <option value="MMSCFM">MMSCFM</option>
                          <option value="MSCFM">MSCFM</option>
                          <option value="SCFM">SCFM</option>
                          <option value="GPH(UK)">GPH(UK)</option>
                          <option value="GPM(UK)">GPM(UK)</option>
                          <option value="dm³/h">dm³/h</option>
                          <option value="MMSCMD">MMSCMD</option>
                          <option value="MSCMD">MSCMD</option>
                          <option value="MMSCMH">MMSCMH</option>
                          <option value="MSCMH">MSCMH</option>
                          <option value="MMSCMM">MMSCMM</option>
                          <option value="MSCMM">MSCMM</option>
                          <option value="bbl/d(US)">bbl/d(US)</option>
                          <option value="bbl/d(oil)">bbl/d(oil)</option>
                          <option value="bbl/d(UK)">bbl/d(UK)</option>
                          <option value="bbl/h(US)">bbl/h(US)</option>
                          <option value="bbl/h(oil)">bbl/h(oil)</option>
                          <option value="bbl/h(UK)">bbl/h(UK)</option>
                        </>
                      ) : (
                        // 일반용 단위 옵션 (액체용)
                        <>
                          <option value="bbl/d(oil)">bbl/d(oil)</option>
                          <option value="bbl/d(UK)">bbl/d(UK)</option>
                          <option value="bbl/d(US)">bbl/d(US)</option>
                          <option value="bbl/h(oil)">bbl/h(oil)</option>
                          <option value="bbl/h(UK)">bbl/h(UK)</option>
                          <option value="bbl/h(US)">bbl/h(US)</option>
                          <option value="dm³/h">dm³/h</option>
                          <option value="ft³/h">ft³/h</option>
                          <option value="ft³/min">ft³/min</option>
                          <option value="gal/d(UK)">gal/d(UK)</option>
                          <option value="gal/d(US)">gal/d(US)</option>
                          <option value="gal/h(UK)">gal/h(UK)</option>
                          <option value="gal/h(US)">gal/h(US)</option>
                          <option value="gal/min(UK)">gal/min(UK)</option>
                          <option value="gal/min(US)">gal/min(US)</option>
                          <option value="GPD(US)">GPD(US)</option>
                          <option value="GPH(US)">GPH(US)</option>
                          <option value="GPM(US)">GPM(US)</option>
                          <option value="l/h">l/h</option>
                          <option value="l/min">l/min</option>
                          <option value="l/s">l/s</option>
                          <option value="m³/d">m³/d</option>
                          <option value="m³/h">m³/h</option>
                          <option value="m³/s">m³/s</option>
                          <option value="ml/h">ml/h</option>
                          <option value="ml/min">ml/min</option>
                        </>
                      )}
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
                    <option value="-">-</option>
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
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>Warning State</td>
                  <td>
                    <Form.Control
                      size="sm"
                      value={formData.WarningStateMax || ''}
                      readOnly
                      style={{ backgroundColor: '#e9ecef' }}
                    />
                  </td>
                  <td>
                    <Form.Control
                      size="sm"
                      value={formData.WarningStateNormal || ''}
                      readOnly
                      style={{ backgroundColor: '#e9ecef' }}
                    />
                  </td>
                  <td>
                    <Form.Control
                      size="sm"
                      value={formData.WarningStateMin || ''}
                      readOnly
                      style={{ backgroundColor: '#e9ecef' }}
                    />
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>Warning Type</td>
                  <td>
                    <Form.Control
                      size="sm"
                      value={formData.WarningTypeMax || ''}
                      readOnly
                      style={{ backgroundColor: '#e9ecef' }}
                    />
                  </td>
                  <td>
                    <Form.Control
                      size="sm"
                      value={formData.WarningTypeNormal || ''}
                      readOnly
                      style={{ backgroundColor: '#e9ecef' }}
                    />
                  </td>
                  <td>
                    <Form.Control
                      size="sm"
                      value={formData.WarningTypeMin || ''}
                      readOnly
                      style={{ backgroundColor: '#e9ecef' }}
                    />
                  </td>
                  <td></td>
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
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>ϱ1</td>
                  <td><Form.Control size="sm" value={formData.FluidP1Max || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.FluidP1Nor || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.FluidP1Min || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.FluidPUnit || 'kg/m³'} onChange={(e) => handleInputChange('FluidPUnit', e.target.value)}>
                    <option value="">단위 선택</option>
                    <option value="kg/m³">kg/m³</option>
                    <option value="kg/l">kg/l</option>
                    <option value="gr/ft³">gr/ft³</option>
                    <option value="lb/ft³">lb/ft³</option>
                    <option value="lb/gal(US)">lb/gal(US)</option>
                    <option value="lb/gal(UK)">lb/gal(UK)</option>
                    <option value="g/ml">g/ml</option>
                    <option value="oz/gal(US)">oz/gal(US)</option>
                    <option value="oz/gal(UK)">oz/gal(UK)</option>
                    <option value="oz/in³">oz/in³</option>
                    <option value="lb/in³">lb/in³</option>
                    <option value="slug/ft³">slug/ft³</option>
                    <option value="ton/yd³(UK)">ton/yd³(UK)</option>
                    <option value="ton/yd³(US)">ton/yd³(US)</option>
                    <option value="g/cm³">g/cm³</option>
                    <option value="mg/l">mg/l</option>
                    <option value="mg/m³">mg/m³</option>
                    <option value="SG.H2O(60°F)">SG.H2O(60°F)</option>
                    <option value="SG.H2O(68°F)">SG.H2O(68°F)</option>
                    <option value="SG.H2O(4°C)">SG.H2O(4°C)</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>ϱ2</td>
                  <td><Form.Control size="sm" value={formData.FluidP2Max || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.FluidP2Nor || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.FluidP2Min || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.FluidPUnit || 'kg/m³'} onChange={(e) => handleInputChange('FluidPUnit', e.target.value)}>
                    <option value="">단위 선택</option>
                    <option value="kg/m³">kg/m³</option>
                    <option value="kg/l">kg/l</option>
                    <option value="gr/ft³">gr/ft³</option>
                    <option value="lb/ft³">lb/ft³</option>
                    <option value="lb/gal(US)">lb/gal(US)</option>
                    <option value="lb/gal(UK)">lb/gal(UK)</option>
                    <option value="g/ml">g/ml</option>
                    <option value="oz/gal(US)">oz/gal(US)</option>
                    <option value="oz/gal(UK)">oz/gal(UK)</option>
                    <option value="oz/in³">oz/in³</option>
                    <option value="lb/in³">lb/in³</option>
                    <option value="slug/ft³">slug/ft³</option>
                    <option value="ton/yd³(UK)">ton/yd³(UK)</option>
                    <option value="ton/yd³(US)">ton/yd³(US)</option>
                    <option value="g/cm³">g/cm³</option>
                    <option value="mg/l">mg/l</option>
                    <option value="mg/m³">mg/m³</option>
                    <option value="SG.H2O(60°F)">SG.H2O(60°F)</option>
                    <option value="SG.H2O(68°F)">SG.H2O(68°F)</option>
                    <option value="SG.H2O(4°C)">SG.H2O(4°C)</option>
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
                  <td><Form.Control size="sm" value={formData.FluidN1Max || ''} onChange={(e) => handleInputChange('FluidN1Max', e.target.value)} disabled={fluidType !== 'n1'} /></td>
                  <td><Form.Control size="sm" value={formData.FluidN1Nor || ''} onChange={(e) => handleInputChange('FluidN1Nor', e.target.value)} disabled={fluidType !== 'n1'} /></td>
                  <td><Form.Control size="sm" value={formData.FluidN1Min || ''} onChange={(e) => handleInputChange('FluidN1Min', e.target.value)} disabled={fluidType !== 'n1'} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.FluidN1Unit || 'mPa s'} onChange={(e) => handleInputChange('FluidN1Unit', e.target.value)}>
                    <option value="">단위 선택</option>
                    <option value="Pa s">Pa s</option>
                    <option value="mPa s">mPa s</option>
                    <option value="μPa s">μPa s</option>
                    <option value="N s/m²">N s/m²</option>
                    <option value="mN s/m²">mN s/m²</option>
                    <option value="μN s/m²">μN s/m²</option>
                    <option value="kp s/m²">kp s/m²</option>
                    <option value="lb/(ft h)">lb/(ft h)</option>
                    <option value="g/(cm s)">g/(cm s)</option>
                    <option value="kp h/m²">kp h/m²</option>
                    <option value="kg/(ft h)">kg/(ft h)</option>
                    <option value="lb/(ft s)">lb/(ft s)</option>
                    <option value="Poise">Poise</option>
                    <option value="cP">cP</option>
                    <option value="mP">mP</option>
                    <option value="kg/(m s)">kg/(m s)</option>
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
                  <td><Form.Control size="sm" value={formData.FluidV1Max || ''} onChange={(e) => handleInputChange('FluidV1Max', e.target.value)} disabled={fluidType !== 'v1'} /></td>
                  <td><Form.Control size="sm" value={formData.FluidV1Nor || ''} onChange={(e) => handleInputChange('FluidV1Nor', e.target.value)} disabled={fluidType !== 'v1'} /></td>
                  <td><Form.Control size="sm" value={formData.FluidV1Min || ''} onChange={(e) => handleInputChange('FluidV1Min', e.target.value)} disabled={fluidType !== 'v1'} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.FluidV1Unit || 'mm²/s'} onChange={(e) => handleInputChange('FluidV1Unit', e.target.value)}>
                    <option value="">단위 선택</option>
                    <option value="m²/s">m²/s</option>
                    <option value="cST">cST</option>
                    <option value="mm²/s">mm²/s</option>
                    <option value="m²/h">m²/h</option>
                    <option value="ft²/s">ft²/s</option>
                    <option value="ft²/h">ft²/h</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>pv1</td>
                  <td>
                    <Form.Control 
                      size="sm" 
                      value={formData.FluidPV1Max || ''} 
                      onChange={(e) => handleInputChange('FluidPV1Max', e.target.value)}
                    />
                  </td>
                  <td>
                    <Form.Control 
                      size="sm" 
                      value={formData.FluidPV1Nor || ''} 
                      onChange={(e) => handleInputChange('FluidPV1Nor', e.target.value)}
                    />
                  </td>
                  <td>
                    <Form.Control 
                      size="sm" 
                      value={formData.FluidPV1Min || ''} 
                      onChange={(e) => handleInputChange('FluidPV1Min', e.target.value)}
                    />
                  </td>
                  <td>
                    <Form.Select 
                      size="sm" 
                      value={formData.FluidPV1Unit || 'bar(a)'} 
                      onChange={(e) => handleInputChange('FluidPV1Unit', e.target.value)}
                    >
                      <option value="">단위 선택</option>
                      <option value="bar(a)">bar(a)</option>
                      <option value="mbar(a)">mbar(a)</option>
                      <option value="Pa(a)">Pa(a)</option>
                      <option value="kPa(a)">kPa(a)</option>
                      <option value="MPa(a)">MPa(a)</option>
                      <option value="at(a)">at(a)</option>
                      <option value="atm(a)">atm(a)</option>
                      <option value="kp/cm²(a)">kp/cm²(a)</option>
                      <option value="N/m²(a)">N/m²(a)</option>
                      <option value="N/mm²(a)">N/mm²(a)</option>
                      <option value="Torr(a)">Torr(a)</option>
                      <option value="mmHg(a)">mmHg(a)</option>
                      <option value="mmH2O(a)">mmH2O(a)</option>
                      <option value="psi(a)">psi(a)</option>
                      <option value="ftH2O(a)">ftH2O(a)</option>
                      <option value="inHg(a)">inHg(a)</option>
                      <option value="inH2O(a)">inH2O(a)</option>
                      <option value="lbf/ft²(a)">lbf/ft²(a)</option>
                      <option value="bar(g)">bar(g)</option>
                      <option value="mbar(g)">mbar(g)</option>
                      <option value="Pa(g)">Pa(g)</option>
                      <option value="kPa(g)">kPa(g)</option>
                      <option value="MPa(g)">MPa(g)</option>
                      <option value="at(g)">at(g)</option>
                      <option value="atm(g)">atm(g)</option>
                      <option value="kp/cm²(g)">kp/cm²(g)</option>
                      <option value="N/m²(g)">N/m²(g)</option>
                      <option value="N/mm²(g)">N/mm²(g)</option>
                      <option value="Torr(g)">Torr(g)</option>
                      <option value="mmHg(g)">mmHg(g)</option>
                      <option value="mmH2O(g)">mmH2O(g)</option>
                      <option value="psi(g)">psi(g)</option>
                      <option value="ftH2O(g)">ftH2O(g)</option>
                      <option value="inHg(g)">inHg(g)</option>
                      <option value="inH2O(g)">inH2O(g)</option>
                      <option value="lbf/ft²(g)">lbf/ft²(g)</option>
                      <option value="kgf/cm²(a)">kgf/cm²(a)</option>
                      <option value="kgf/cm²(g)">kgf/cm²(g)</option>
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
                    <option value="">단위 선택</option>
                    <option value="°C">°C</option>
                    <option value="K">K</option>
                    <option value="°F">°F</option>
                    <option value="°Reaumur">°Reaumur</option>
                    <option value="°Rankine">°Rankine</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>cF1</td>
                  <td>
                    <Form.Control 
                      size="sm" 
                      value={formData.FluidCF1Max || ''} 
                      onChange={(e) => handleInputChange('FluidCF1Max', e.target.value)}
                    />
                  </td>
                  <td>
                    <Form.Control 
                      size="sm" 
                      value={formData.FluidCF1Nor || ''} 
                      onChange={(e) => handleInputChange('FluidCF1Nor', e.target.value)}
                    />
                  </td>
                  <td>
                    <Form.Control 
                      size="sm" 
                      value={formData.FluidCF1Min || ''} 
                      onChange={(e) => handleInputChange('FluidCF1Min', e.target.value)}
                    />
                  </td>
                  <td>
                    <Form.Select 
                      size="sm" 
                      value={formData.FluidCF1Unit || 'm/s'} 
                      onChange={(e) => handleInputChange('FluidCF1Unit', e.target.value)}
                    >
                      <option value="">단위 선택</option>
                      <option value="m/s">m/s</option>
                      <option value="ft/s">ft/s</option>
                      <option value="mile/h">mile/h</option>
                      <option value="ft/h">ft/h</option>
                      <option value="ft/min">ft/min</option>
                      <option value="in/s">in/s</option>
                      <option value="km/h">km/h</option>
                      <option value="in/min">in/min</option>
                      <option value="cm/min">cm/min</option>
                      <option value="mm/s">mm/s</option>
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
                onClick={handleResetClick}
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
                {isQueued ? '대기 중...' : (isProcessing ? '처리 중...' : 'CONVAL 재호출')}
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
                    <Form.Control
                      size="sm"
                      value={formData.ValveType || ''}
                      readOnly
                      style={{ backgroundColor: '#e9ecef' }}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666', backgroundColor: '#DFDFDF' }}>Trim type</td>
                  <td>
                    <Form.Select
                      size="sm"
                      value={formData.CONVALTrim || ''}
                      onChange={(e) => handleInputChange('CONVALTrim', e.target.value)}
                    >
                      <option value="">선택</option>
                      {formData.ValveType === 'Straight globe valve' ? (
                        // Straight globe valve용 Trim type 옵션
                        <>
                          <option value="Cage trim">Cage trim</option>
                          <option value="Parabolic plug">Parabolic plug</option>
                          <option value="V-port plug">V-port plug</option>
                          <option value="Multi-hole trim">Multi-hole trim</option>
                          <option value="Contoured plug">Contoured plug</option>
                          <option value="Multi stage - multi channel">Multi stage - multi channel</option>
                        </>
                      ) : formData.ValveType === 'Angle Y-seated valve' ? (
                        // Angle Y-seated valve용 Trim type 옵션
                        <>
                          <option value="Cage trim">Cage trim</option>
                          <option value="Parabolic plug">Parabolic plug</option>
                          <option value="V-port plug">V-port plug</option>
                          <option value="Multi-hole trim">Multi-hole trim</option>
                          <option value="Contoured plug">Contoured plug</option>
                          <option value="Multi stage - multi channel">Multi stage - multi channel</option>
                        </>
                      ) : formData.ValveType === 'Rotary plug valve' ? (
                        // Rotary plug valve용 Trim type 옵션
                        <>
                          <option value="Eccentric ball valve">Eccentric ball valve</option>
                          <option value="Eccentric plug valve">Eccentric plug valve</option>
                          <option value="Low-noise plug">Low-noise plug</option>
                        </>
                      ) : formData.ValveType === 'Angle globe valve' ? (
                        // Angle globe valve용 Trim type 옵션
                        <>
                          <option value="Cage trim">Cage trim</option>
                          <option value="Parabolic plug">Parabolic plug</option>
                          <option value="V-port plug">V-port plug</option>
                          <option value="Multi-hole trim">Multi-hole trim</option>
                          <option value="Contoured plug">Contoured plug</option>
                          <option value="Multi stage - multi channel">Multi stage - multi channel</option>
                        </>
                      ) : formData.ValveType === 'Butterfly valve' ? (
                        // Butterfly valve용 Trim type 옵션
                        <>
                          <option value="Centric swing through 90°">Centric swing through 90°</option>
                          <option value="Centric swing through 70°">Centric swing through 70°</option>
                          <option value="Fluted vane 70°">Fluted vane 70°</option>
                          <option value="Eccentric">Eccentric</option>
                          <option value="Centric swing through 60°">Centric swing through 60°</option>
                          <option value="Double eccentric">Double eccentric</option>
                          <option value="Triple eccentric">Triple eccentric</option>
                          <option value="Centric reinforced">Centric reinforced</option>
                        </>
                      ) : formData.ValveType === 'Sleeved plug valve' ? (
                        // Sleeved plug valve용 Trim type 옵션
                        <>
                          <option value="Segmented port">Segmented port</option>
                          <option value="Full port">Full port</option>
                          <option value="Low-noise plug">Low-noise plug</option>
                        </>
                      ) : formData.ValveType === 'Ball valve' ? (
                        // Ball valve용 Trim type 옵션
                        <>
                          <option value="Segmented port">Segmented port</option>
                          <option value="Full port">Full port</option>
                          <option value="Low-noise plug">Low-noise plug</option>
                        </>
                      ) : formData.ValveType === 'Axial valve' ? (
                        // Axial valve용 Trim type 옵션
                        <>
                          <option value="Standard plug">Standard plug</option>
                          <option value="Low-noise plug">Low-noise plug</option>
                        </>
                      ) : (
                        // 기본 옵션 (Valve type이 선택되지 않은 경우)
                        <>
                          <option value="">-- trim type 없음 --</option>
                        </>
                      )}
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
                    <option value="Arbitrary">Arbitrary</option>
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
                    <option value="Multi stage valve (heavy duty)">Multi stage valve (heavy duty)</option>
                    <option value="Special valve">Special valve</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666', backgroundColor: '#DFDFDF' }}>Protection</td>
                  <td>
                    <Form.Select size="sm" value={formData.Protection || ''} onChange={(e) => handleInputChange('Protection', e.target.value)}>
                    <option value="">선택</option>
                  <option value="Non-hardened">Non-hardened</option>
                  <option value="Hardened seat/plug">Hardened seat/plug</option>
                  <option value="Hardened seat/plug and outlet-liner">Hardened seat/plug and outlet-liner</option>
                  <option value="Soft sealing">Soft sealing</option>
                  <option value="PTFE/PFA liner">PTFE/PFA liner</option>
                  <option value="Ceramic alloy trim">Ceramic alloy trim</option>
                  <option value="Ceramic alloy trim and body">Ceramic alloy trim and body</option>
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
                  <option value="Equal percentage">Equal percentage</option>
                  <option value="Linear">Linear</option>
                  <option value="Modified">Modified</option>
                  <option value="On/off">On/off</option>
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
                      <option value="-">-</option>
                      </Form.Select>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666', backgroundColor: '#DFDFDF' }}>Flow coefficient</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Form.Control size="sm" value={formData.FlowCoeff || ''} readOnly style={{ backgroundColor: '#e9ecef', maxWidth: '80px' }} />
                      <Form.Select size="sm" value={formData.FlowCoeffUnit || 'm³/h'} onChange={(e) => handleInputChange('FlowCoeffUnit', e.target.value)} style={{ maxWidth: '100px' }}>
                      <option value="">단위 선택</option>
                    <option value="m³/h">m³/h</option>
                    <option value="GPM(US)">GPM(US)</option>
                      </Form.Select>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666', backgroundColor: '#DFDFDF' }}>Normal flow coefficient</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Form.Control size="sm" value={formData.NorFlowCoeff || ''} onChange={(e) => handleInputChange('NorFlowCoeff', e.target.value)} style={{ maxWidth: '80px' }} />
                      <Form.Select size="sm" value={formData.FlowCoeffUnit || 'm³/h'} onChange={(e) => handleInputChange('FlowCoeffUnit', e.target.value)} style={{ maxWidth: '100px' }}>
                      <option value="">단위 선택</option>
                    <option value="m³/h">m³/h</option>
                    <option value="GPM(US)">GPM(US)</option>
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
                  <option value="DIN (legacy)">DIN (legacy)</option>
                  <option value="EN (metric)">EN (metric)</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666', backgroundColor: '#DFDFDF' }}>Selected valve size</td>
                  <td>
                    <Form.Select size="sm" value={formData.BodySize || ''} onChange={(e) => handleInputChange('BodySize', e.target.value)}>
                    <option value="">선택</option>
                  <option value={'1/2"'}>1/2"</option>
                  <option value={'3/4"'}>3/4"</option>
                  <option value={'1"'}>1"</option>
                  <option value={'1 1/4"'}>1 1/4"</option>
                  <option value={'1 1/2"'}>1 1/2"</option>
                  <option value={'2"'}>2"</option>
                  <option value={'2 1/2"'}>2 1/2"</option>
                  <option value={'3"'}>3"</option>
                  <option value={'4"'}>4"</option>
                  <option value={'5"'}>5"</option>
                  <option value={'6"'}>6"</option>
                  <option value={'8"'}>8"</option>
                  <option value={'10"'}>10"</option>
                  <option value={'12"'}>12"</option>
                  <option value={'14"'}>14"</option>
                  <option value={'16"'}>16"</option>
                  <option value={'18"'}>18"</option>
                  <option value={'20"'}>20"</option>
                  <option value={'22"'}>22"</option>
                  <option value={'24"'}>24"</option>
                  <option value={'26"'}>26"</option>
                  <option value={'28"'}>28"</option>
                  <option value={'30"'}>30"</option>
                  <option value={'32"'}>32"</option>
                  <option value={'36"'}>36"</option>
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
                  <option value="class 900">class 900</option>
                  <option value="class 1500">class 1500</option>
                  <option value="class 2500">class 2500</option>
                  <option value="class 4500">class 4500</option>
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
                    <option value="-">-</option>
                    </Form.Select>
                  </td>
                </tr>
                <tr>
                  <td className="text-center" style={{ backgroundColor: '#DFDFDF' }}>u1</td>
                  <td><Form.Control size="sm" value={formData.U1Max || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.U1Nor || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td><Form.Control size="sm" value={formData.U1Min || ''} readOnly style={{ backgroundColor: '#e9ecef' }} /></td>
                  <td>
                    <Form.Select size="sm" value={formData.U1Unit || 'm/s'} onChange={(e) => handleInputChange('U1Unit', e.target.value)}>
                    <option value="">단위 선택</option>
                    <option value="m/s">m/s</option>
                    <option value="ft/s">ft/s</option>
                    <option value="mile/h">mile/h</option>
                    <option value="ft/h">ft/h</option>
                    <option value="ft/min">ft/min</option>
                    <option value="in/s">in/s</option>
                    <option value="km/h">km/h</option>
                    <option value="in/min">in/min</option>
                    <option value="cm/min">cm/min</option>
                    <option value="mm/s">mm/s</option>
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
