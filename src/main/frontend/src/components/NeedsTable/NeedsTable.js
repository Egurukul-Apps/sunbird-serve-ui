import React, {useState, useEffect, useMemo} from 'react'
import axios from 'axios'
import { useTable, usePagination, useGlobalFilter, useFilters, useSortBy } from 'react-table'
import ModifyNeed from '../ModifyNeed/ModifyNeed'
import './NeedsTable.css'
import SearchIcon from '@mui/icons-material/Search';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { FaSort } from "react-icons/fa"
import configData from './../../configData.json'
import {auth} from '../../firebase.js'

export const NeedsTable = props => {
  const [dataNew,setDataNew] = useState([]);
  const [dataNominated,setDataNominated] = useState([]);
  const [dataApproved,setDataApproved] = useState([]);
  const [dataRejected,setDataRejected] = useState([]);
  const [dataNeed, setDataNeed] = useState([]);
  const [dataNeedType,setDataNeedType] = useState([]);

  const currentUser = auth.currentUser;
  const [userId, setUserId] = useState(null)

  //fetch list of all approved need types
  useEffect(()=> {
    axios.get(`${configData.NEEDTYPE_GET}/?page=0&size=100&status=Approved`)
    .then(
      //function(response){console.log(response.data.content)},
      response => setDataNeedType(Object.values(response.data.content))
    )
    .catch(function (error) {
        console.log('error'); 
    }) 
  },[])

  //get userId from authenticated emailId
  useEffect(() => {
    const fetchData = async () => {
      try {
        const email = currentUser.email.replace(/@/g, "%40");
        console.log(email);
  
        const response = await axios.get(`${configData.USER_GET}/?email=${email}`);
        console.log(response.data.osid)
        setUserId(response.data.osid);
      } catch (error) {
        console.log(error);
        // Handle error
      }
    };
  
    if (currentUser.email) {
      fetchData();
    }
  }, [currentUser.email, userId]);


  //using the userId, get different types of needs user raised
  useEffect(() => {
    const fetchData = async () => {
      try {
        const newNeedsResponse = axios.get(`${configData.NEED_BY_USER}/${userId}?page=0&size=100&status=New`);
        const nominatedNeedsResponse = axios.get(`${configData.NEED_BY_USER}/${userId}?page=0&size=100&status=Nominated`);
        const approvedNeedsResponse = axios.get(`${configData.NEED_BY_USER}/${userId}?page=0&size=100&status=Approved`);
        const rejectedNeedsResponse = axios.get(`${configData.NEED_BY_USER}/${userId}?page=0&size=100&status=Rejected`);

        const [newNeeds, approvedNeeds, nominatedNeeds, rejectedNeeds] = await Promise.all(
          [newNeedsResponse, approvedNeedsResponse, nominatedNeedsResponse, rejectedNeedsResponse]);
        setDataNew(newNeeds.data.content);
        setDataApproved(approvedNeeds.data.content);
        setDataRejected(rejectedNeeds.data.content);
        setDataNominated(nominatedNeeds.data.content);
        setDataNeed([...newNeeds.data.content, ...approvedNeeds.data.content, ...rejectedNeeds.data.content, ...nominatedNeeds.data.content]);
      } catch (error) {
        console.log("Error fetching needs:", error);
      }
    };
  
    if (userId) {
      fetchData();
    }
  }, [userId]);

  function NeedTypeById({ needTypeId }) {
    const [needType, setNeedType] = useState(null);
    useEffect(() => {
    axios
      .get(`${configData.NEEDTYPE_GET}/${needTypeId}`)
      .then((response) => {
        setNeedType(response.data.name);
      })
      .catch((error) => {
        console.error("Fetching Need Type failed:", error);
      });
    }, [needTypeId]);
   return <span>{needType || ''}</span>;
  }

  function EntityById({ entityId }) {
    const [entityName, setEntityName] = useState(null);
     useEffect(() => {
       axios
         .get(`${configData.ENTITY_GET}/${entityId}`)
         .then((response) => {
           setEntityName(response.data.name);
         })
         .catch((error) => {
           console.error("Fetching Entity failed:", error);
         });
     }, [entityId]);
     return <span>{entityName || ''}</span>;
  }
  
  function TimelineByReqId({ requirementId }) {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
     useEffect(() => {
       axios
         .get(`${configData.NEED_REQUIREMENT_GET}/${requirementId}`)
         .then((response) => {
            setStartDate(response.data.startDate)
            setEndDate(response.data.endDate)
         })
         .catch((error) => {
           console.error("Fetching Entity failed:", error);
         });
         
     }, [requirementId]);

     if(startDate && endDate) {
        return <span>{(startDate.substr(2,8).split('-').reverse().join('/')+'-'+endDate.substr(2,8).split('-').reverse().join('/'))}</span>
     } else {
      return <span>''</span>
     }
    }

  
  const COLUMNS = [
    { Header: 'Need Name', accessor: 'name', width: 250 },
    { Header: 'Need Type', accessor: 'needTypeId',
      Cell: ({ value }) => {
      return <NeedTypeById needTypeId={value} />;
      }
    },
    { Header: 'Location',  width: 144 },
    { Header: 'Entity', accessor: 'entityId', 
      Cell: ({ value }) => {
      return <EntityById entityId={value} />;
      }
  
    }, 
    { Header: 'Volunteer', width: 112 },
    { Header: 'Timeline', accessor: 'requirementId', 
      Cell: ({ value }) => {
      return <TimelineByReqId requirementId={value} />;
      }
    },
    { Header: 'Status', accessor: 'status', width: 109, filter: 'text' }
  ]
  const columns = useMemo(() => COLUMNS, [userId, dataNeed, dataNeedType]);

  const [filteredData, setFilteredData] = useState([])
  const [needTypeId, setNeedTypeId] = useState('')
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(()=>{
    let filtered = dataNeed
    if(needTypeId){
      const filtered = dataNeed.filter(item => item.needTypeId === needTypeId)
      setFilteredData(filtered)
    //} else if (selectedDate) {
    //  const filtered = dataNeed.filter(item => new Date(item.startDate) >= new Date(selectedDate))
    //  setFilteredData(filtered)
    } else {
      setFilteredData(filtered)
    }
  },[dataNeed, needTypeId, selectedDate])

  console.log(selectedDate)
  dataNeed.filter(item => console.log(item.startDate))

  const handleNeedType = e => {
    setNeedTypeId(e.target.value)
  }
  // get need data through props
  //const data = useMemo(() => dataNeed,[dataNeed])
  const data = useMemo(() => filteredData,[filteredData])
  
  
  console.log(filteredData)
  console.log(dataNeed)

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    state,
    setGlobalFilter,
    page,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    pageOptions,
    gotoPage,
    pageCount,
    setPageSize,
    prepareRow,
    setFilter,
    } = useTable ({
    columns,
    data
    },
    useFilters, useGlobalFilter, useSortBy, usePagination)

  const [showPopup, setShowPopup] = useState(false);
  const [rowData, setRowData] = useState(null);

  const handleRowClick = (rowData) => {
    setRowData(rowData);
    setShowPopup(!showPopup);
  };
  const handleDateChange = e => {
    setSelectedDate(e.target.value)
  }
  

  const { globalFilter, pageIndex, pageSize } = state;

  const [filterValue, setFilterValue] = useState('')

  useEffect(() => {
    if (props.tab === 'approved') {
      setFilter('status', 'Approved')
    }
    else if (props.tab == 'requested') {
      setFilter('status', 'Nominated')
    }
    else {
      setFilter('status','')
    }
  }, [props.tab])


  return (
    <div className="wrapTable">
      {/* Header on top of table containing search, data, type, need and volunteer count */}
      <div className="topBarNeedTable">
        <div className="leftTopBarNeedTable">
          <div className="needCount">
            <i><StickyNote2Icon /></i>
            <span>{Object.keys(dataNeed).length}</span>
            <label>Needs</label>
          </div>
          <div className="volunteerCount">
            <i><PeopleAltIcon /></i>
            <span> </span>
            <label>Volunteers</label>
          </div>
        </div>
        <div className="rightTopBarNeedTable">
          {/* Following are filters on need table */}
          <div className="boxSearchNeeds">
            <i><SearchIcon style={{height:'18px',width:'18px'}}/></i>
            <input type="search" name="globalfilter" placeholder="Search need" value={globalFilter || ''} onChange={(e) => setGlobalFilter(e.target.value)}></input>
          </div>
          {/*
          <div className="selectNeedDate">
            <input type="date" name="selectedDate" value={selectedDate} onChange={handleDateChange} />
          </div>
          */}
          <select className="selectNeedType" name="needTypeId" value={needTypeId} onChange={handleNeedType} >
            <option value="" defaultValue>Need Type</option>
            {
              dataNeedType.map(
                  (ntype) => <option key={ntype.osid} value={ntype.id}>{ntype.name}</option>
                )
              }
          </select>
        </div>
      </div>
      {/* Following is TABLE that loads list of needs and its details */}
      <table className="tableNeedList">
        <thead>
            {headerGroups.map((headerGroup)=>(
                <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column)=>(
                        <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                            {column.render('Header')}
                            <span>
                              <FaSort />
                            </span>
                        </th>
                    ))}
                </tr>
            ))}
        </thead>
        <tbody {...getTableBodyProps()}>
            {page.map((row) => {
                prepareRow(row)
                return (
                    <tr {...row.getRowProps()} onClick={() => handleRowClick(row.original)} >
                        {row.cells.map((cell)=>{
                            return <td {...cell.getCellProps()} style={{ width: cell.column.width }}> {cell.render('Cell')}</td>
                        })}
                    </tr>
                )
            })}
        </tbody>
      </table>
      <div className="pageNav">
        <div className="needsPerPage">
          <span>Rows per page:</span>
          <select value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))}>
            {[10, 15, 25].map((pageSize) => (
              <option key={pageSize} value={pageSize}>{pageSize}</option>
            ))}
          </select>
        </div>
        <span>
          Go to
            <input type="number" defaultValue={pageIndex+1}
            onChange={e => {
              const pageNumber = e.target.value ? Number(e.target.value) - 1 : 0
              gotoPage(pageNumber)
            }}
            style={{width:'50px'}}
            />
          page
        </span>

        <div className="pageNumber">
        <button onClick={()=>previousPage()} disabled={!canPreviousPage}> <ArrowBackIosIcon style={{height:"18px"}}/></button>
        <span> Page
          <strong>
              {pageIndex + 1} 
          </strong>
          of {pageOptions.length}
        </span>
        <button onClick={()=>nextPage()} disabled={!canNextPage}><ArrowForwardIosIcon style={{height:"18px"}}/></button>
        </div>
      </div>
      {/* Open nominations and need info page as popup */}
      { showPopup && <ModifyNeed handleClose={handleRowClick} data={rowData} /> }
    </div>
  )
}

export default NeedsTable