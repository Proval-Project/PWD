import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Row, Col, Form, Table } from 'react-bootstrap';
import { getFileStatus, downloadPdf, downloadCcv } from '../services/api';

const ConvalDataDisplay = ({ data, isLoading, onRecalculate, isProcessing, onFileStatusRefresh }) => {
  const [formData, setFormData] = useState({});
  const [fileStatus, setFileStatus] = useState({ pdfExists: false, ccvExists: false });
  const [downloading, setDownloading] = useState({ pdf: false, ccv: false });
  const [fluidType, setFluidType] = useState('n1'); // 'n1' 또는 'v1' 선택
  const [pressureType, setPressureType] = useState('p2'); // 'p2' 또는 'dp' 선택
  const [flowType, setFlowType] = useState('qm'); // 'qm' 또는 'qn' 선택
  const [massType, setMassType] = useState('density'); // 'density' 또는 'molecular' 선택
  
  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  // 백엔드 플래그 값으로 토글 동기화
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

  // Density/Molecular 상호배타 전환 시 반대쪽 값 초기화 - 자동 초기화 제거
  // useEffect(() => {
  //   setFormData((prev) => {
  //     if (!prev) return prev;
  //     if (massType === 'density') {
  //       return { ...prev, Molecular: '', MolecularWeightUnit: '', IsDensity: true };
  //     }
  //     return { ...prev, Density: '', DensityUnit: '', IsDensity: false };
  //   });
  // }, [massType]);

  // p2/dp 토글 변경 시 formData에 저장
  useEffect(() => {
    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, IsP2: pressureType === 'p2' };
    });
  }, [pressureType]);

  // qm/qn 토글 변경 시 formData에 저장
  useEffect(() => {
    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, IsQM: flowType === 'qm' };
    });
  }, [flowType]);

  // n1/v1 토글 변경 시 formData에 저장
  useEffect(() => {
    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, IsN1: fluidType === 'n1' };
    });
  }, [fluidType]);

  // massType 토글 변경 시 formData에 저장 (초기화 없이)
  useEffect(() => {
    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, IsDensity: massType === 'density' };
    });
  }, [massType]);

  // 평탄화된 구조로 입력값 관리
  const handleInputChange = (field, _unused, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    // 무한 루프 방지를 위해 onDataChange 호출 제거
  };

  const renderConvalData = () => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div className="text-center text-muted p-3">
          CONVAL 데이터가 없습니다.
        </div>
      );
    }
    
    return (
      <div>
        <h6 className="mb-3">CONVAL DATA (CONVAL 데이터)</h6>
        
        {/* Medium selection and state */}
        <div className="mb-3">
          <h6 className="mb-2">Medium selection and state</h6>
          <Table bordered size="sm">
            <tbody>
              <tr>
                <td className="fw-bold" style={{width: '30%'}}>Medium</td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.Medium || ''}
                    onChange={(e) => handleInputChange('Medium', null, e.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td className="fw-bold">Fluid</td>
                <td>
                <Form.Select
                  size="sm"
                  value={formData.Fluid || ''}
                  onChange={(e) => handleInputChange('Fluid', null, e.target.value)}
                  >
                  <option value="">선택</option>
                  <option value="Liquid">Liquid</option>
                  <option value="Vaporous">Vaporous</option>
                  <option value="Gaseous">Gaseous</option>
                </Form.Select>
                </td>
              </tr>
              <tr>
                <td className="fw-bold">
                  <div className="d-flex align-items-center gap-3">
                    
                    <div className="d-flex gap-2">
                      <Form.Check
                        type="radio"
                        id="density-radio"
                        name="massType"
                        label="Density"
                        checked={massType === 'density'}
                        onChange={() => setMassType('density')}
                      />
                      <Form.Check
                        type="radio"
                        id="molecular-radio"
                        name="massType"
                        label="Molecular"
                        checked={massType === 'molecular'}
                        onChange={() => setMassType('molecular')}
                      />
                    </div>
                  </div>
                </td>
                
              </tr>
              <tr>
                <td className="fw-bold">Density</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      size="sm"
                      value={formData.Density || ''}
                      onChange={(e) => handleInputChange('Density', null, e.target.value)}
                      style={{ maxWidth: 200 }}
                      disabled={massType !== 'density'}
                    />
                    <Form.Select
                      size="sm"
                      value={formData.DensityUnit || 'kg/m³'}
                      onChange={(e) => setFormData({ ...formData, DensityUnit: e.target.value })}
                      style={{ maxWidth: 140 }}
                      disabled={massType !== 'density'}
                    >
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
                <td className="fw-bold">Molecular</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      size="sm"
                      value={formData.Molecular || ''}
                      onChange={(e) => handleInputChange('Molecular', null, e.target.value)}
                      style={{ maxWidth: 200 }}
                      disabled={massType !== 'molecular'}
                    />
                    <Form.Select
                      size="sm"
                      value={formData.MolecularWeightUnit || 'kg/kmol'}
                      onChange={(e) => setFormData({ ...formData, MolecularWeightUnit: e.target.value })}
                      style={{ maxWidth: 140 }}
                      disabled={massType !== 'molecular'}
                    >
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
        <div className="mb-3">
          <h6 className="mb-2">Operating data</h6>
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
                <td className="fw-bold">t1</td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.t1Max || ''}
                    onChange={(e) => handleInputChange('t1Max', null, e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.t1Normal || ''}
                    onChange={(e) => handleInputChange('t1Normal', null, e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.t1Min || ''}
                    onChange={(e) => handleInputChange('t1Min', null, e.target.value)}
                  />
                </td>
                                 <td>
                  <Form.Select
                    size="sm"
                    value={formData.t1Unit || '°C'}
                    onChange={(e) => setFormData({ ...formData, t1Unit: e.target.value })}
                  >
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
                <td className="fw-bold">p1</td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.p1Max || ''}
                    onChange={(e) => handleInputChange('p1Max', null, e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.p1Normal || ''}
                    onChange={(e) => handleInputChange('p1Normal', null, e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.p1Min || ''}
                    onChange={(e) => handleInputChange('p1Min', null, e.target.value)}
                  />
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    value={formData.PressureUnit || 'bar(a)'}
                    onChange={(e) => setFormData({ ...formData, PressureUnit: e.target.value })}
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
                <td className="fw-bold">
                  <div className="d-flex align-items-center gap-3">
                    
                    <div className="d-flex gap-2">
                      <Form.Check
                        type="radio"
                        id="p2-radio"
                        name="pressureType"
                        label="p2"
                        checked={pressureType === 'p2'}
                        onChange={() => setPressureType('p2')}
                      />
                      <Form.Check
                        type="radio"
                        id="dp-radio"
                        name="pressureType"
                        label="Δp"
                        checked={pressureType === 'dp'}
                        onChange={() => setPressureType('dp')}
                      />
                    </div>
                  </div>
                </td>
                
              </tr>
              <tr>
                <td className="fw-bold">
                  p2
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.p2Max || ''}
                    onChange={(e) => handleInputChange('p2Max', null, e.target.value)}
                    disabled={pressureType !== 'p2'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.p2Normal || ''}
                    onChange={(e) => handleInputChange('p2Normal', null, e.target.value)}
                    disabled={pressureType !== 'p2'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.p2Min || ''}
                    onChange={(e) => handleInputChange('p2Min', null, e.target.value)}
                    disabled={pressureType !== 'p2'}
                  />
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    value={formData.PressureUnit || 'bar(a)'}
                    onChange={(e) => setFormData({ ...formData, PressureUnit: e.target.value })}
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
                <td className="fw-bold">
                  Δp
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.dpMax || ''}
                    onChange={(e) => handleInputChange('dpMax', null, e.target.value)}
                    disabled={pressureType !== 'dp'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.dpNormal || ''}
                    onChange={(e) => handleInputChange('dpNormal', null, e.target.value)}
                    disabled={pressureType !== 'dp'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.dpMin || ''}
                    onChange={(e) => handleInputChange('dpMin', null, e.target.value)}
                    disabled={pressureType !== 'dp'}
                  />
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    value={formData.PressureUnit || 'bar(a)'}
                    onChange={(e) => setFormData({ ...formData, PressureUnit: e.target.value })}
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
                <td className="fw-bold">CV</td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.CVMax || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.CVNormal || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.CVMin || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    value={formData.CVUnit || 'm³/h'}
                    onChange={(e) => setFormData({ ...formData, CVUnit: e.target.value })}
                  >
                    <option value="">단위 선택</option>
                    <option value="m³/h">m³/h</option>
                    <option value="GPM(US)">GPM(US)</option>
                  </Form.Select>
                </td>
              </tr>
              <tr>
                <td className="fw-bold">
                  <div className="d-flex align-items-center gap-3">
                    
                    <div className="d-flex gap-2">
                      <Form.Check
                        type="radio"
                        id="qm-radio"
                        name="flowType"
                        label="qm"
                        checked={flowType === 'qm'}
                        onChange={() => setFlowType('qm')}
                      />
                      <Form.Check
                        type="radio"
                        id="qn-radio"
                        name="flowType"
                        label="qn"
                        checked={flowType === 'qn'}
                        onChange={() => setFlowType('qn')}
                      />
                    </div>
                  </div>
                </td>
              
              </tr>
              <tr>
                <td className="fw-bold">
                  qm
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.qmMax || ''}
                    onChange={(e) => handleInputChange('qmMax', null, e.target.value)}
                    disabled={flowType !== 'qm'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.qmNormal || ''}
                    onChange={(e) => handleInputChange('qmNormal', null, e.target.value)}
                    disabled={flowType !== 'qm'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.qmMin || ''}
                    onChange={(e) => handleInputChange('qmMin', null, e.target.value)}
                    disabled={flowType !== 'qm'}
                  />
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    value={formData.qmUnit || 'kg/h'}
                    onChange={(e) => setFormData({ ...formData, qmUnit: e.target.value })}
                  >
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
                <td className="fw-bold">
                  qn
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.qnMax || ''}
                    onChange={(e) => handleInputChange('qnMax', null, e.target.value)}
                    disabled={flowType !== 'qn'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.qnNormal || ''}
                    onChange={(e) => handleInputChange('qnNormal', null, e.target.value)}
                    disabled={flowType !== 'qn'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.qnMin || ''}
                    onChange={(e) => handleInputChange('qnMin', null, e.target.value)}
                    disabled={flowType !== 'qn'}
                  />
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    value={formData.qnUnit || 'm³/h'}
                    onChange={(e) => setFormData({ ...formData, qnUnit: e.target.value })}
                    disabled={flowType !== 'qn'}
                  >
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
                <td className="fw-bold">s/s100</td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.SS100Max || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.SS100Nor || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.SS100Min || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    value={formData.SS100Unit || '%'}
                    onChange={(e) => setFormData({ ...formData, SS100Unit: e.target.value })}
                  >
                    <option value="%">%</option>
                    <option value="-">-</option>
                  </Form.Select>
                </td>
              </tr>
              <tr>
                <td className="fw-bold">LpAe</td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.LpAeMax || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.LpAeNormal || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.LpAeMin || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>dB(A)</td>
              </tr>
              <tr>
                <td className="fw-bold">Warning State</td>
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
                <td className="fw-bold">Warning Type</td>
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
      </div>
    );
  };

  const renderFluidOperatingData = () => {
    return (
      <div className="mt-4">
        <h6 className="mb-3">Fluid Operating data (유체 작동 데이터)</h6>
        <Table bordered size="sm">
          <tbody>
            <tr>
              <td className="fw-bold" style={{width: '30%'}}>ϱ1</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.FluidP1Max || ''}
                    onChange={(e) => handleInputChange('FluidP1Max', null, e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.FluidP1Nor || ''}
                    onChange={(e) => handleInputChange('FluidP1Nor', null, e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.FluidP1Min || ''}
                    onChange={(e) => handleInputChange('FluidP1Min', null, e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                  <Form.Select
                    size="sm"
                    value={formData.FluidPUnit || 'kg/m³'}
                    onChange={(e) => setFormData({ ...formData, FluidPUnit: e.target.value })}
                    style={{ maxWidth: 140 }}
                  >
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
              <td className="fw-bold">ϱ2</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.FluidP2Max || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.FluidP2Nor || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.FluidP2Min || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Select
                    size="sm"
                    value={formData.FluidPUnit || 'kg/m³'}
                    onChange={(e) => setFormData({ ...formData, FluidPUnit: e.target.value })}
                    style={{ maxWidth: 140 }}
                  >
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
              <td className="fw-bold">
                <div className="d-flex align-items-center gap-3">
                  
                  <div className="d-flex gap-2">
                    <Form.Check
                      type="radio"
                      id="n1-radio"
                      name="fluidType"
                      label="η1"
                      checked={fluidType === 'n1'}
                      onChange={() => setFluidType('n1')}
                    />
                    <Form.Check
                      type="radio"
                      id="v1-radio"
                      name="fluidType"
                      label="ν1"
                      checked={fluidType === 'v1'}
                      onChange={() => setFluidType('v1')}
                    />
                  </div>
                </div>
              </td>
              
            </tr>
            <tr>
              <td className="fw-bold">
              η1
              </td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.FluidN1Max || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                    disabled={fluidType !== 'n1'}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.FluidN1Nor || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                    disabled={fluidType !== 'n1'}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.FluidN1Min || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                    disabled={fluidType !== 'n1'}
                  />
                  <Form.Select
                    size="sm"
                    value={formData.FluidN1Unit || 'mPa s'}
                    onChange={(e) => setFormData({ ...formData, FluidN1Unit: e.target.value })}
                    style={{ maxWidth: 140 }}
                  >
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
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">
              ν1
              </td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.FluidV1Max || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                    disabled={fluidType !== 'v1'}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.FluidV1Nor || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                    disabled={fluidType !== 'v1'}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.FluidV1Min || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                    disabled={fluidType !== 'v1'}
                  />
                  <Form.Select
                    size="sm"
                    value={formData.FluidV1Unit || 'mm²/s'}
                    onChange={(e) => setFormData({ ...formData, FluidV1Unit: e.target.value })}
                    style={{ maxWidth: 140 }}
                  >
                    <option value="">단위 선택</option>
                    <option value="m²/s">m²/s</option>
                    <option value="cST">cST</option>
                    <option value="mm²/s">mm²/s</option>
                    <option value="m²/h">m²/h</option>
                    <option value="ft²/s">ft²/s</option>
                    <option value="ft²/h">ft²/h</option>
                  </Form.Select>
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">pv1</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.FluidPV1Max || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.FluidPV1Nor || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.FluidPV1Min || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Select
                    size="sm"
                    value={formData.FluidPV1Unit || 'bar(a)'}
                    onChange={(e) => setFormData({ ...formData, FluidPV1Unit: e.target.value })}
                    style={{ maxWidth: 140 }}
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
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">tv1</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.FluidTV1Max || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.FluidTV1Nor || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.FluidTV1Min || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Select
                    size="sm"
                    value={formData.FluidTV1Unit || '°C'}
                    onChange={(e) => setFormData({ ...formData, FluidTV1Unit: e.target.value })}
                    style={{ maxWidth: 140 }}
                  >
                    <option value="">단위 선택</option>
                    <option value="°C">°C</option>
                    <option value="K">K</option>
                    <option value="°F">°F</option>
                    <option value="°Reaumur">°Reaumur</option>
                    <option value="°Rankine">°Rankine</option>
                  </Form.Select>
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">cF1</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.FluidCF1Max || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.FluidCF1Nor || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.FluidCF1Min || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Select
                    size="sm"
                    value={formData.FluidCF1Unit || 'm/s'}
                    onChange={(e) => setFormData({ ...formData, FluidCF1Unit: e.target.value })}
                    style={{ maxWidth: 140 }}
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
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">ϰ</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.FluidKMax || ''}
                    onChange={(e) => handleInputChange('FluidKMax', null, e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.FluidKNor || ''}
                    onChange={(e) => handleInputChange('FluidKNor', null, e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.FluidKMin || ''}
                    onChange={(e) => handleInputChange('FluidKMin', null, e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    );
  };

  const renderValveConfiguration = () => {
    return (
      <div className="mt-4">
        <h6 className="mb-3">Valve Configuration (밸브 구성)</h6>
        <Table bordered size="sm">
          <tbody>
                         <tr>
               <td className="fw-bold" style={{width: '30%'}}>Valve type</td>
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
              <td className="fw-bold">Trim type</td>
              <td>
                <Form.Select
                  size="sm"
                  value={formData.CONVALTrim || ''}
                  onChange={(e) => handleInputChange('CONVALTrim', null, e.target.value)}
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
              <td className="fw-bold">Flow direction</td>
              <td>
                <Form.Select
                  size="sm"
                  value={formData.FlowDirection || ''}
                  onChange={(e) => handleInputChange('FlowDirection', null, e.target.value)}
                >
                  <option value="">선택</option>
                  <option value="FTO">FTO</option>
                  <option value="FTC">FTC</option>
                  <option value="Arbitrary">Arbitrary</option>
                </Form.Select>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Valve performance class</td>
              <td>
                <Form.Select
                  size="sm"
                  value={formData.ValvePerformClass || ''}
                  onChange={(e) => handleInputChange('ValvePerformClass', null, e.target.value)}
                >
                  <option value="">선택</option>
                  <option value="Heavy duty valve">Heavy duty valve</option>
                  <option value="Multi stage valve">Multi stage valve</option>
                  <option value="Multi stage valve (heavy duty)">Multi stage valve (heavy duty)</option>
                  <option value="Special valve">Special valve</option>
                </Form.Select>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Protection</td>
              <td>
                <Form.Select
                  size="sm"
                  value={formData.Protection || ''}
                  onChange={(e) => handleInputChange('Protection', null, e.target.value)}
                >
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
    );
  };

  const renderValveData = () => {
    return (
      <div className="mt-4">
        <h6 className="mb-3">Valve data (밸브 데이터)</h6>
        <Table bordered size="sm">
          <tbody>
            <tr>
              <td className="fw-bold" style={{width: '30%'}}>Basic characteristic</td>
              <td>
                <Form.Select
                  size="sm"
                  value={formData.BasicCharacter || ''}
                  onChange={(e) => handleInputChange('BasicCharacter', null, e.target.value)}
                >
                  <option value="">선택</option>
                  <option value="Equal percentage">Equal percentage</option>
                  <option value="Linear">Linear</option>
                  <option value="Modified">Modified</option>
                  <option value="On/off">On/off</option>
                </Form.Select>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Theoretical rangeability</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    value={formData.TheoreticalRangeability || ''}
                    onChange={(e) => handleInputChange('TheoreticalRangeability', null, e.target.value)}
                  />
                  <Form.Select
                    size="sm"
                    value={formData.TheoreticalRangeabilityUnit || '%'}
                    onChange={(e) => setFormData({ ...formData, TheoreticalRangeabilityUnit: e.target.value })}
                    style={{ maxWidth: 100 }}
                  >
                    <option value="%">%</option>
                    <option value="-">-</option>
                  </Form.Select>
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Flow coefficient</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    value={formData.FlowCoeff || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                  <Form.Select
                    size="sm"
                    value={formData.FlowCoeffUnit || 'm³/h'}
                    onChange={(e) => setFormData({ ...formData, FlowCoeffUnit: e.target.value })}
                    style={{ maxWidth: 140 }}
                  >
                    <option value="">단위 선택</option>
                    <option value="m³/h">m³/h</option>
                    <option value="GPM(US)">GPM(US)</option>
                  </Form.Select>
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Normal flow coefficient</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    value={formData.NorFlowCoeff || ''}
                    onChange={(e) => handleInputChange('NorFlowCoeff', null, e.target.value)}
                  />
                  <Form.Select
                    size="sm"
                    value={formData.FlowCoeffUnit || 'm³/h'}
                    onChange={(e) => setFormData({ ...formData, FlowCoeffUnit: e.target.value })}
                    style={{ maxWidth: 140 }}
                  >
                    <option value="">단위 선택</option>
                    <option value="m³/h">m³/h</option>
                    <option value="GPM(US)">GPM(US)</option>
                  </Form.Select>
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Size pressure class</td>
              <td>
                <Form.Select
                  size="sm"
                  value={formData.SizePressureClass || ''}
                  onChange={(e) => handleInputChange('SizePressureClass', null, e.target.value)}
                >
                  <option value="">선택</option>
                  <option value="ANSI">ANSI</option>
                  <option value="DIN (legacy)">DIN (legacy)</option>
                  <option value="EN (metric)">EN (metric)</option>
                </Form.Select>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Selected valve size</td>
              <td>
                <Form.Select
                  size="sm"
                  value={formData.BodySize || ''}
                  onChange={(e) => handleInputChange('BodySize', null, e.target.value)}
                >
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
              <td className="fw-bold">Pressure class</td>
              <td>
                <Form.Select
                  size="sm"
                  value={formData.PressureClass || ''}
                  onChange={(e) => handleInputChange('PressureClass', null, e.target.value)}
                >
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
    );
  };

  const renderLoadDependentValues = () => {
    return (
      <div className="mt-4">
        <h6 className="mb-3">Load-dependent values (부하 의존 값)</h6>
        <Table bordered size="sm">
          <tbody>
          <tr>
            <td className="fw-bold" style={{width: '30%'}}>s/s100</td>
            <td>
              <div className="d-flex align-items-center gap-2">
                <Form.Control
                  size="sm"
                  placeholder="Max"
                  value={formData.SS100Max || ''}
                  readOnly
                  style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                />
                <Form.Control
                  size="sm"
                  placeholder="Normal"
                  value={formData.SS100Nor || ''}
                  readOnly
                  style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                />
                <Form.Control
                  size="sm"
                  placeholder="Min"
                  value={formData.SS100Min || ''}
                  readOnly
                  style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                />
                <Form.Select
                  size="sm"
                  value={formData.SS100Unit || '%'}
                  onChange={(e) => setFormData({ ...formData, SS100Unit: e.target.value })}
                  style={{ maxWidth: 100 }}
                >
                  <option value="%">%</option>
                  <option value="-">-</option>
                </Form.Select>
              </div>
            </td>
          </tr>
            <tr>
              <td className="fw-bold">u1</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.U1Max || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.U1Nor || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.U1Min || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Select
                    size="sm"
                    value={formData.U1Unit || 'm/s'}
                    onChange={(e) => setFormData({ ...formData, U1Unit: e.target.value })}
                    style={{ maxWidth: 120 }}
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
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">u2</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.U2Max || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.U2Nor || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.U2Min || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Select
                    size="sm"
                    value={formData.U1Unit || 'm/s'}
                    onChange={(e) => setFormData({ ...formData, U1Unit: e.target.value })}
                    style={{ maxWidth: 120 }}
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
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">LpAe</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.LpAeMax || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.LpAeNormal || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.LpAeMin || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <span className="ms-2">dB(A)</span>
                </div>
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    );
  };

  // 파일 상태 확인
  useEffect(() => {
    if (data?.TempEstimateNo) {
      checkFileStatus(data.TempEstimateNo);
    }
  }, [data?.TempEstimateNo]);

  // CONVAL 재계산 완료 후 파일 상태 새로고침
  useEffect(() => {
    if (!isProcessing && data?.TempEstimateNo) {
      // 재계산이 완료되면 파일 상태를 다시 확인
      setTimeout(() => {
        checkFileStatus(data.TempEstimateNo);
      }, 2000); // 2초 후 확인 (파일 생성 시간 고려)
    }
  }, [isProcessing, data?.TempEstimateNo]);

  const checkFileStatus = async (estimateNo) => {
    try {
      const status = await getFileStatus(estimateNo);
      setFileStatus({
        pdfExists: status.pdfExists,
        ccvExists: status.ccvExists
      });
      if (onFileStatusRefresh) {
        onFileStatusRefresh();
      }
    } catch (error) {
      console.error('파일 상태 확인 실패:', error);
      setFileStatus({ pdfExists: false, ccvExists: false });
      if (onFileStatusRefresh) {
        onFileStatusRefresh();
      }
    }
  };

  // PDF 파일 다운로드
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

  // CCV 파일 다운로드
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

  // PDF 파일 바로 읽기 (새 탭에서 열기)
    const handlePdfView = async () => {
    if (!data?.TempEstimateNo) return;
    
    try {
      const apiUrl = `http://192.168.0.59:7001/api/conval/download/pdf/${data.TempEstimateNo}`;
      console.log('PDF 요청 URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
        mode: 'cors', // CORS 모드 명시적 설정
      });
      
      console.log('PDF 응답 상태:', response.status, response.statusText);
      
      if (response.ok) {
        const blob = await response.blob();
        console.log('PDF Blob 크기:', blob.size);
        const url = window.URL.createObjectURL(blob);
        
        // 새 탭에서 PDF 열기
        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
          alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
          window.URL.revokeObjectURL(url);
          return;
        }
        
        // 메모리 누수 방지를 위해 나중에 URL 해제
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      } else {
        const errorText = await response.text();
        console.error('PDF 서버 오류:', response.status, errorText);
        alert(`PDF 파일을 열 수 없습니다: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('PDF 파일 열기 실패:', error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        alert('네트워크 연결을 확인해주세요. 서버가 실행 중인지 확인하세요.');
      } else {
        alert('PDF 파일 열기 실패: ' + error.message);
      }
    }
  };

  // CCV 파일 바로 읽기 (새 탭에서 열기)
  const handleCcvView = async () => {
    if (!data?.TempEstimateNo) return;
    
    try {
      const apiUrl = `http://192.168.0.59:7001/api/conval/download/ccv/${data.TempEstimateNo}`;
      console.log('CCV 요청 URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain, application/octet-stream',
        },
        mode: 'cors', // CORS 모드 명시적 설정
      });
      
      console.log('CCV 응답 상태:', response.status, response.statusText);
      
      if (response.ok) {
        const blob = await response.blob();
        console.log('CCV Blob 크기:', blob.size);
        const url = window.URL.createObjectURL(blob);
        
        // 새 탭에서 CCV 파일 열기
        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
          alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
          window.URL.revokeObjectURL(url);
          return;
        }
        
        // 메모리 누수 방지를 위해 나중에 URL 해제
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      } else {
        const errorText = await response.text();
        console.error('CCV 서버 오류:', response.status, errorText);
        alert(`CCV 파일을 열 수 없습니다: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('CCV 파일 열기 실패:', error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        alert('네트워크 연결을 확인해주세요. 서버가 실행 중인지 확인하세요.');
      } else {
        alert('CCV 파일 열기 실패: ' + error.message);
      }
    }
  };

  const renderFileDownload = () => {
    return (
      <div className="mt-4">
        <h6 className="mb-3">파일 다운로드 (File Download)</h6>
        <Row>
          <Col md={6}>
            <div className="mb-2">
              <strong>PDF 파일</strong>
              
            </div>
            <div className="d-flex gap-2">
              <Button 
                size="sm" 
                variant="outline-primary"
                onClick={handlePdfDownload}
                disabled={downloading.pdf}
              >
                {downloading.pdf ? '다운로드 중...' : '다운로드'}
              </Button>
              <Button 
                size="sm" 
                variant="outline-secondary"
                onClick={handlePdfView}
              >
                바로읽기
              </Button>
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-2">
              <strong>CCV 파일</strong>
              
            </div>
            <div className="d-flex gap-2">
              <Button 
                size="sm" 
                variant="outline-primary"
                onClick={handleCcvDownload}
                disabled={downloading.ccv}
              >
                {downloading.ccv ? '다운로드 중...' : '다운로드'}
              </Button>
              <Button 
                size="sm" 
                variant="outline-secondary"
                onClick={handleCcvView}
              >
                바로읽기
              </Button>
            </div>
          </Col>
        </Row>
        
      </div>
    );
  };

  // CONVAL 재호출 콘솔 출력용 핸들러 추가
  const handleRecalculate = async () => {
    console.log('[CONVAL] 재호출 버튼 클릭');
    if (onRecalculate) {
      try {
        console.log('[CONVAL] 재호출 요청 시작');
        // 현재 폼 데이터를 포함하여 전달
        const currentData = {
          ...formData,
          IsP2: pressureType === 'p2',
          IsQM: flowType === 'qm',
          IsN1: fluidType === 'n1',
          IsDensity: massType === 'density'
        };
        console.log('[CONVAL] 전달할 데이터:', currentData);
        const result = await onRecalculate(currentData);
        console.log('[CONVAL] 재호출 응답:', result);
      } catch (error) {
        console.error('[CONVAL] 재호출 중 오류:', error);
      }
    }
  };

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5>CONVAL Data (DataSheetLv3)</h5>
        <Button 
          variant="warning" 
          size="sm"
          onClick={handleRecalculate}
          disabled={isProcessing || isLoading}
        >
          {isProcessing ? (
            <>
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">처리 중...</span>
              </div>
              처리 중...
            </>
          ) : (
            'CONVAL 재호출'
          )}
        </Button>
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
            {renderConvalData()}
            {renderFluidOperatingData()}
            {renderValveConfiguration()}
            {renderValveData()}
            {renderLoadDependentValues()}
            {renderFileDownload()}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ConvalDataDisplay; 